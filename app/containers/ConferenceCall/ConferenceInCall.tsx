import { isTrackReference, RoomContext, useLocalParticipant, VideoTrack } from '@livekit/react-native';
import { type ReactElement, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { useElapsedSeconds } from '~/lib/hooks/useElapsedSeconds';
import { useRoomUnread } from '~/lib/hooks/useRoomUnread';
import { ensureCameraPermission } from '~/lib/methods/ensureCameraPermission';
import { isIOS } from '~/lib/methods/helpers';
import { countMembersWhoCannotSeeChat } from '~/lib/methods/helpers/countMembersWhoCannotSeeChat';
import { isInVideoConference } from '~/lib/methods/helpers/isInVideoConference';
import log from '~/lib/methods/helpers/log';
import { needsActiveSpeaker } from '~/lib/methods/helpers/needsActiveSpeaker';
import { pickPipSource } from '~/lib/methods/helpers/pickPipSource';
import { pickFeaturedTile } from '~/lib/methods/helpers/splitByPriority';
import { showToast } from '~/lib/methods/helpers/showToast';
import { orderRaisedHands } from '~/lib/services/conference/callDataProtocol';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { VIDEO_QUALITY_LABELS } from './buildConferenceMenuOptions';
import ChatAccessNotice from './ChatAccessNotice';
import ConferenceControls from './ConferenceControls';
import ConferenceHeader from './ConferenceHeader';
import ConferencePipSource from './ConferencePipSource';
import ConferencePipView from './ConferencePipView';
import ConferenceStage from './ConferenceStage';
import OverflowTileView from './OverflowTileView';
import ParticipantTileView from './ParticipantTileView';
import PresentingPills from './PresentingPills';
import RaisedHandPill from './RaisedHandPill';
import ReactionLayer from './ReactionLayer';
import ScreenShareStage from './ScreenShareStage';
import ScreenSharePicker, { type TScreenSharePickerHandle } from './ScreenSharePicker';
import SidebarStage from './SidebarStage';
import SpeakingWhileMutedNotice from './SpeakingWhileMutedNotice';
import SpotlightStage from './SpotlightStage';
import TileSpeakingMonitors from './TileSpeakingMonitors';
import { useActiveSpeakerId } from './useActiveSpeakerId';
import { useAutoLowerHand } from './useAutoLowerHand';
import { useConferenceMenus } from './useConferenceMenus';
import { useConferencePictureInPicture } from './useConferencePictureInPicture';
import { type IConferenceTile, type TConferenceScreenShare, useConferenceTiles } from './useConferenceTiles';
import { useFeaturedScreen } from './useFeaturedScreen';
import { useOpenConferenceChat } from './useOpenConferenceChat';
import { useTileSpeaking } from './useTileSpeaking';

const REACTION_SWEEP_MS = 500;

const styles = StyleSheet.create({
	content: {
		flex: 1
	},
	stage: {
		flex: 1
	},
	banner: {
		paddingVertical: 6,
		alignItems: 'center'
	},
	bannerText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	}
});

const screenVideo = ({ trackRef }: TConferenceScreenShare): ReactElement =>
	isTrackReference(trackRef) ? <VideoTrack trackRef={trackRef} style={StyleSheet.absoluteFill} objectFit='contain' /> : <View />;

const screenLabel = ({ isLocal, name }: TConferenceScreenShare): string =>
	isLocal ? I18n.t('Your_screen') : I18n.t('Screen_of_name', { name });

interface IRaisedHandsLabel {
	raisedHands: { id: string }[];
	selfId: string;
	nameById: Map<string, string>;
}

const raisedHandsLabel = ({ raisedHands, selfId, nameById }: IRaisedHandsLabel): string => {
	const [first] = raisedHands;
	const firstName = first.id === selfId ? I18n.t('You') : (nameById.get(first.id) ?? '');
	const others = raisedHands.length - 1;
	return others > 0 ? `${firstName} +${others}` : firstName;
};

const InCallContent = (): ReactElement => {
	const { colors } = useTheme();
	const pickerRef = useRef<TScreenSharePickerHandle>(null);
	const callId = useConferenceCallStore(state => state.callId);
	const connectedAt = useConferenceCallStore(state => state.connectedAt);
	const phase = useConferenceCallStore(state => state.phase);
	const expanded = useConferenceCallStore(state => state.expanded);
	const hands = useConferenceInteractionStore(state => state.hands);
	const reactions = useConferenceInteractionStore(state => state.reactions);
	const layout = useConferenceInteractionStore(state => state.layout);
	const videoQuality = useConferenceInteractionStore(state => state.videoQuality);
	const cameraFacing = useConferenceInteractionStore(state => state.cameraFacing);
	const audioOutput = useConferenceInteractionStore(state => state.audioOutput);
	const sweepExpiredReactions = useConferenceInteractionStore(state => state.sweepExpiredReactions);

	const { info } = useConferenceInfo(callId, { live: true });
	const openChat = useOpenConferenceChat(info);
	const chatUnread = useRoomUnread(info?.chatAccess.rid);
	const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
	const { tiles, shares, speakers } = useConferenceTiles();
	const { featured: featuredShare, others: otherShares, pin } = useFeaturedScreen(shares);

	const toggleScreenShare = async () => {
		if (isIOS && !isScreenShareEnabled) {
			await pickerRef.current?.show();
		}
		await conferenceSession.toggleScreenShare();
	};

	const { showPeople, showReactions, showAudioOutput, showCameraOptions, showMore, showChatAccess } = useConferenceMenus({
		isScreenSharing: !!isScreenShareEnabled,
		onToggleScreenShare: toggleScreenShare
	});

	const elapsedSeconds = useElapsedSeconds(connectedAt);

	const speakingIds = new Set(speakers.map(({ identity }) => identity));
	const { speakingByLevel, onTileSpeaking } = useTileSpeaking();
	const remoteSpeakers = speakers.filter(({ isLocal }) => !isLocal);
	const activeSpeakerId = useActiveSpeakerId(
		remoteSpeakers,
		needsActiveSpeaker({ shares, tiles, gridLayout: layout === 'grid', expanded })
	);
	const pipSource = pickPipSource({ shares, tiles, activeSpeakerId });
	const inPictureInPicture = useConferencePictureInPicture(expanded);
	const selfId = localParticipant.identity;

	const handRaised = (hands[selfId] ?? 0) > 0;

	useAutoLowerHand({
		handRaised,
		micEnabled: isMicrophoneEnabled,
		isSpeaking: speakingIds.has(selfId)
	});

	const raisedHands = orderRaisedHands(hands);
	const handPositions = new Map(raisedHands.map(({ id }, index) => [id, index + 1]));
	const nameById = new Map(tiles.map(({ id, name }) => [id, name]));

	const peopleCount = info ? info.users.filter(isInVideoConference).length : tiles.length;

	const hasReactions = reactions.length > 0;

	useEffect(() => {
		if (!hasReactions) {
			return;
		}
		const interval = setInterval(() => sweepExpiredReactions(Date.now()), REACTION_SWEEP_MS);
		return () => clearInterval(interval);
	}, [hasReactions, sweepExpiredReactions]);

	const toggleMic = () => {
		conferenceSession.setMicrophone(!isMicrophoneEnabled).catch(log);
	};

	const toggleCamera = async () => {
		if (!isCameraEnabled && !(await ensureCameraPermission())) {
			showToast(I18n.t('Camera_access_needed'));
			return;
		}
		conferenceSession.setCamera(!isCameraEnabled).catch(log);
	};

	const handPill = raisedHands.length ? (
		<RaisedHandPill
			label={raisedHandsLabel({ raisedHands, selfId, nameById })}
			accessibilityLabel={I18n.t('Raised_hands')}
			onPress={showPeople}
		/>
	) : null;

	const pills = (
		<>
			<PresentingPills
				presenters={shares.map(({ name, isLocal }) => ({ name: name ?? '', isSelf: isLocal }))}
				onStop={toggleScreenShare}
			/>
			{handPill}
		</>
	);

	const renderTile = (tile: IConferenceTile, { floating = false }: { floating?: boolean } = {}) => (
		<ParticipantTileView
			identity={tile.id}
			name={tile.name}
			muted={tile.muted}
			video={
				tile.hasCamera && tile.cameraTrack && isTrackReference(tile.cameraTrack) ? (
					<VideoTrack
						trackRef={tile.cameraTrack}
						style={StyleSheet.absoluteFill}
						objectFit='cover'
						mirror={tile.isSelf && cameraFacing === 'user'}
						zOrder={floating ? 1 : 0}
					/>
				) : null
			}
			speaking={!tile.muted && (speakingIds.has(tile.id) || speakingByLevel.has(tile.id))}
			handPosition={handPositions.get(tile.id)}
			badge={tile.isSelf && videoQuality !== 'auto' ? VIDEO_QUALITY_LABELS[videoQuality] : undefined}
			testID={`conference-tile-${tile.id}`}
		/>
	);

	const renderOverflow = (hidden: IConferenceTile[]) => <OverflowTileView hidden={hidden} />;

	const renderStage = () => {
		if (featuredShare) {
			return (
				<ScreenShareStage
					featured={{
						key: featuredShare.id,
						video: screenVideo(featuredShare),
						label: screenLabel(featuredShare)
					}}
					others={otherShares.map(share => ({
						key: share.id,
						video: screenVideo(share),
						label: screenLabel(share),
						onSpotlight: () => pin(share.id)
					}))}
					tiles={tiles}
					renderTile={tile => renderTile(tile)}
				/>
			);
		}
		if (tiles.length > 0 && layout === 'spotlight') {
			return (
				<SpotlightStage
					featured={pickFeaturedTile(tiles, { activeSpeakerId, selfId })}
					self={tiles.find(({ isSelf }) => isSelf)}
					renderTile={renderTile}
				/>
			);
		}
		if (tiles.length > 0 && layout === 'sidebar') {
			return (
				<SidebarStage
					featured={pickFeaturedTile(tiles, { activeSpeakerId, selfId })}
					tiles={tiles}
					activeSpeakerId={activeSpeakerId}
					selfId={selfId}
					renderTile={tile => renderTile(tile)}
					renderOverflow={renderOverflow}
				/>
			);
		}
		return (
			<ConferenceStage
				tiles={tiles}
				activeSpeakerId={activeSpeakerId}
				selfId={selfId}
				renderTile={tile => renderTile(tile)}
				renderOverflow={renderOverflow}
			/>
		);
	};

	if (inPictureInPicture) {
		return <ConferencePipView source={pipSource} />;
	}

	return (
		<View style={styles.content} testID='conference-in-call'>
			{phase === 'reconnecting' ? (
				<View style={[styles.banner, { backgroundColor: colors.statusBackgroundWarning }]} testID='conference-reconnecting'>
					<Text style={[styles.bannerText, { color: colors.statusFontWarning }]}>{I18n.t('Reconnecting')}</Text>
				</View>
			) : null}
			<ConferenceHeader
				elapsedSeconds={elapsedSeconds}
				title={info && 'title' in info ? info.title : undefined}
				peopleCount={peopleCount}
				audioOutput={audioOutput}
				onAudioOutputPress={showAudioOutput}
				onPeoplePress={showPeople}
				chatUnread={chatUnread}
				chatDisabled={!info}
				onChatPress={openChat}
				pills={shares.length > 0 || raisedHands.length > 0 ? pills : null}
			/>
			<ChatAccessNotice count={countMembersWhoCannotSeeChat({ info, viewerId: selfId })} onReview={showChatAccess} />
			<View style={styles.stage}>
				{expanded ? <ConferencePipSource source={pipSource} /> : null}
				<TileSpeakingMonitors tiles={tiles} expanded={expanded} onChange={onTileSpeaking} />
				{renderStage()}
				<ReactionLayer reactions={reactions} nameFor={id => nameById.get(id) ?? ''} />
				<SpeakingWhileMutedNotice enabled={!isMicrophoneEnabled && phase === 'connected' && expanded} />
			</View>
			<ConferenceControls
				micEnabled={isMicrophoneEnabled}
				cameraEnabled={isCameraEnabled}
				handRaised={handRaised}
				onToggleMic={toggleMic}
				onToggleCamera={toggleCamera}
				onMicOptions={showAudioOutput}
				onCameraOptions={showCameraOptions}
				onToggleHand={() => conferenceSession.toggleHand()}
				onReaction={showReactions}
				onMore={showMore}
				onLeave={closeConferenceCall}
			/>
			{isIOS ? <ScreenSharePicker ref={pickerRef} /> : null}
		</View>
	);
};

const ConferenceInCall = (): ReactElement | null => {
	const room = useConferenceRoomStore(state => state.room);

	if (!room) {
		return null;
	}

	return (
		<RoomContext.Provider value={room}>
			<InCallContent />
		</RoomContext.Provider>
	);
};

export default ConferenceInCall;
