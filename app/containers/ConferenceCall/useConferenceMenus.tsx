import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { isIOS } from '~/lib/methods/helpers';
import { type TCameraDevice } from '~/lib/methods/helpers/pickCameraDevices';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';
import { enterConferencePictureInPicture } from '~/lib/services/conference/conferencePictureInPicture';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { AudioSession } from '~/lib/services/conference/livekit';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import {
	buildAudioOutputOptions,
	buildCameraOptions,
	buildLayoutOptions,
	buildVideoQualityOptions
} from './buildConferenceMenuOptions';
import AddParticipantsSheetContent from './AddParticipantsSheetContent';
import ChatAccessSheetContent from './ChatAccessSheetContent';
import ConnectionInfoSheetContent from './ConnectionInfoSheetContent';
import PeopleSheetContent from './PeopleSheetContent';
import ReactionPicker from './ReactionPicker';

interface IConferenceMenusOptions {
	isScreenSharing: boolean;
	onToggleScreenShare: () => void;
	peopleCount: number;
}

const SHEET_TRANSITION_MS = 300;
const TITLE_HEIGHT = 48;
const MIN_CAMERAS_TO_CHOOSE = 3;

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
	},
	count: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	}
});

export const useConferenceMenus = ({ isScreenSharing, onToggleScreenShare, peopleCount }: IConferenceMenusOptions) => {
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

	const showChatAccess = useCallback(() => {
		showActionSheet({
			children: <ChatAccessSheetContent />,
			snaps: ['80%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	}, [showActionSheet]);

	const showPeople = useCallback(() => {
		const swapSheet = (show: () => void) => {
			hideActionSheet();
			afterSheetClosed(show);
		};
		showActionSheet({
			children: (
				<PeopleSheetContent
					onAddPeople={() => swapSheet(showAddParticipants)}
					onReviewChatAccess={() => swapSheet(showChatAccess)}
				/>
			),
			snaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	}, [showActionSheet, hideActionSheet, afterSheetClosed, showAddParticipants, showChatAccess]);

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

	const renderTitle = useCallback(
		(title: string) => (
			<View style={styles.title}>
				<Text style={[styles.titleText, { color: colors.fontTitlesLabels }]}>{title}</Text>
			</View>
		),
		[colors]
	);

	const showAudioOutput = useCallback(async () => {
		try {
			const outputs = await AudioSession.getAudioOutputs();
			const { audioOutput } = useConferenceInteractionStore.getState();
			const options = buildAudioOutputOptions(outputs, audioOutput, colors, output => {
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
			showActionSheet({ customHeader: renderTitle(I18n.t('Audio_output')), headerHeight: TITLE_HEIGHT, options });
		} catch (error) {
			log(error);
		}
	}, [showActionSheet, colors, renderTitle]);

	const showVideoQuality = useCallback(() => {
		const { videoQuality } = useConferenceInteractionStore.getState();
		showActionSheet({
			customHeader: renderTitle(I18n.t('Send_resolution_maximum')),
			headerHeight: TITLE_HEIGHT,
			options: buildVideoQualityOptions(videoQuality, colors, quality => {
				conferenceSession.setVideoQuality(quality);
			})
		});
	}, [showActionSheet, colors, renderTitle]);

	const showLayout = useCallback(() => {
		const { layout, setLayout } = useConferenceInteractionStore.getState();
		showActionSheet({
			options: buildLayoutOptions(layout, colors, selected => setLayout(selected))
		});
	}, [showActionSheet, colors]);

	const showCameraPicker = useCallback(
		(cameras: TCameraDevice[]) => {
			const { cameraDeviceId, cameraFacing } = useConferenceInteractionStore.getState();
			const selectedId = cameraDeviceId ?? cameras.find(({ facing }) => facing === cameraFacing)?.deviceId;
			showActionSheet({
				customHeader: renderTitle(I18n.t('Camera')),
				headerHeight: TITLE_HEIGHT,
				options: buildCameraOptions(cameras, selectedId, colors, ({ deviceId, facing }) => {
					conferenceSession.selectCamera(deviceId, facing ?? 'environment').catch(log);
				})
			});
		},
		[showActionSheet, colors, renderTitle]
	);

	const showCameraOptions = useCallback(async () => {
		const cameras = await conferenceSession.listCameras();
		const chooseCamera: TActionSheetOptionsItem[] =
			cameras.length >= MIN_CAMERAS_TO_CHOOSE
				? [{ title: I18n.t('Choose_camera'), icon: 'video', onPress: () => afterSheetClosed(() => showCameraPicker(cameras)) }]
				: [];
		showActionSheet({
			options: [
				{ title: I18n.t('Switch_camera'), icon: 'refresh', onPress: () => conferenceSession.switchCamera() },
				...chooseCamera,
				{ title: I18n.t('Send_resolution_maximum'), icon: 'video', onPress: () => afterSheetClosed(showVideoQuality) }
			]
		});
	}, [showActionSheet, afterSheetClosed, showCameraPicker, showVideoQuality]);

	const enterPictureInPicture = useCallback(async () => {
		try {
			if (!(await enterConferencePictureInPicture())) {
				showToast(I18n.t('Picture_in_picture_unavailable'));
			}
		} catch (error) {
			log(error);
		}
	}, []);

	const showMore = useCallback(() => {
		showActionSheet({
			options: [
				{
					title: I18n.t('People'),
					accessibilityLabel: `${I18n.t('People')}. ${peopleCount}`,
					icon: 'team',
					right: () => <Text style={[styles.count, { color: colors.fontSecondaryInfo }]}>{peopleCount}</Text>,
					onPress: () => afterSheetClosed(showPeople)
				},
				{
					title: isScreenSharing ? I18n.t('Stop_sharing_screen') : I18n.t('Share_screen'),
					icon: 'desktop',
					onPress: onToggleScreenShare
				},
				{ title: I18n.t('Layout'), icon: 'view-medium', onPress: () => afterSheetClosed(showLayout) },
				{ title: I18n.t('Switch_camera'), icon: 'refresh', onPress: () => conferenceSession.switchCamera() },
				{ title: I18n.t('Send_resolution_maximum'), icon: 'video', onPress: () => afterSheetClosed(showVideoQuality) },
				{ title: I18n.t('Picture_in_picture'), icon: 'arrow-collapse', onPress: () => afterSheetClosed(enterPictureInPicture) },
				{ title: I18n.t('Connection_info'), icon: 'info', onPress: () => afterSheetClosed(showConnectionInfo) }
			]
		});
	}, [
		showActionSheet,
		colors,
		peopleCount,
		isScreenSharing,
		onToggleScreenShare,
		afterSheetClosed,
		showPeople,
		showLayout,
		showVideoQuality,
		enterPictureInPicture,
		showConnectionInfo
	]);

	return { showPeople, showReactions, showAudioOutput, showCameraOptions, showMore, showChatAccess };
};
