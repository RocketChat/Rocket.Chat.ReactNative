import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import { isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { AudioSession } from '~/lib/services/conference/livekit';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { buildAudioOutputOptions, buildLayoutOptions, buildVideoQualityOptions } from './buildConferenceMenuOptions';
import AddParticipantsSheetContent from './AddParticipantsSheetContent';
import ConnectionInfoSheetContent from './ConnectionInfoSheetContent';
import PeopleSheetContent from './PeopleSheetContent';
import ReactionPicker from './ReactionPicker';

interface IConferenceMenusOptions {
	isScreenSharing: boolean;
	onToggleScreenShare: () => void;
}

const SHEET_TRANSITION_MS = 300;
const TITLE_HEIGHT = 48;

const styles = StyleSheet.create({
	title: {
		height: TITLE_HEIGHT,
		paddingHorizontal: 24,
		justifyContent: 'center'
	},
	titleText: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24
	}
});

export const useConferenceMenus = ({ isScreenSharing, onToggleScreenShare }: IConferenceMenusOptions) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const afterSheetClosed = useCallback((callback: () => void) => {
		setTimeout(callback, SHEET_TRANSITION_MS);
	}, []);

	const showAddParticipants = useCallback(() => {
		showActionSheet({
			children: <AddParticipantsSheetContent />,
			snaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	}, [showActionSheet]);

	const showPeople = useCallback(() => {
		showActionSheet({
			children: (
				<PeopleSheetContent
					onAddPeople={() => {
						hideActionSheet();
						afterSheetClosed(showAddParticipants);
					}}
				/>
			),
			snaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	}, [showActionSheet, hideActionSheet, afterSheetClosed, showAddParticipants]);

	const showConnectionInfo = useCallback(() => {
		showActionSheet({
			children: <ConnectionInfoSheetContent />,
			snaps: ['60%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	}, [showActionSheet]);

	const showReactions = useCallback(() => {
		showActionSheet({
			children: (
				<ReactionPicker
					onPick={emoji => {
						hideActionSheet();
						conferenceSession.sendReaction(emoji);
					}}
				/>
			)
		});
	}, [showActionSheet, hideActionSheet]);

	const showAudioOutput = useCallback(async () => {
		try {
			const outputs = await AudioSession.getAudioOutputs();
			const options = buildAudioOutputOptions(outputs, output => {
				conferenceSession.selectAudioOutput(output).catch(log);
			});
			if (isIOS) {
				options.push({
					title: I18n.t('Audio_output_choose'),
					icon: 'signal',
					onPress: () => {
						AudioSession.showAudioRoutePicker().catch(log);
					}
				});
			}
			showActionSheet({ options });
		} catch (error) {
			log(error);
		}
	}, [showActionSheet]);

	const showVideoQuality = useCallback(() => {
		const { videoQuality } = useConferenceInteractionStore.getState();
		showActionSheet({
			customHeader: (
				<View style={styles.title}>
					<Text style={[styles.titleText, { color: colors.fontTitlesLabels }]}>{I18n.t('Send_resolution_maximum')}</Text>
				</View>
			),
			headerHeight: TITLE_HEIGHT,
			options: buildVideoQualityOptions(videoQuality, colors, quality => {
				conferenceSession.setVideoQuality(quality);
			})
		});
	}, [showActionSheet, colors]);

	const showLayout = useCallback(() => {
		const { layout, setLayout } = useConferenceInteractionStore.getState();
		showActionSheet({
			options: buildLayoutOptions(layout, colors, selected => setLayout(selected))
		});
	}, [showActionSheet, colors]);

	const showCameraOptions = useCallback(() => {
		showActionSheet({
			options: [
				{ title: I18n.t('Switch_camera'), icon: 'refresh', onPress: () => conferenceSession.switchCamera() },
				{ title: I18n.t('Send_resolution_maximum'), icon: 'video', onPress: () => afterSheetClosed(showVideoQuality) }
			]
		});
	}, [showActionSheet, afterSheetClosed, showVideoQuality]);

	const showMore = useCallback(() => {
		showActionSheet({
			options: [
				{
					title: isScreenSharing ? I18n.t('Stop_sharing_screen') : I18n.t('Share_screen'),
					icon: 'desktop',
					onPress: onToggleScreenShare
				},
				{ title: I18n.t('Layout'), icon: 'view-medium', onPress: () => afterSheetClosed(showLayout) },
				{ title: I18n.t('Switch_camera'), icon: 'refresh', onPress: () => conferenceSession.switchCamera() },
				{ title: I18n.t('Send_resolution_maximum'), icon: 'video', onPress: () => afterSheetClosed(showVideoQuality) },
				{ title: I18n.t('Connection_info'), icon: 'info', onPress: () => afterSheetClosed(showConnectionInfo) }
			]
		});
	}, [showActionSheet, isScreenSharing, onToggleScreenShare, afterSheetClosed, showLayout, showVideoQuality, showConnectionInfo]);

	return { showPeople, showReactions, showAudioOutput, showCameraOptions, showMore };
};
