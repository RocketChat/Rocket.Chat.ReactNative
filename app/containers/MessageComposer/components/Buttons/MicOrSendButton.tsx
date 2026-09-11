import { requestRecordingPermissionsAsync, getRecordingPermissionsAsync, PermissionStatus } from 'expo-audio';
import { useContext, type ReactElement } from 'react';
import { Alert } from 'react-native';

import i18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { openAppSettings } from '../../../../lib/methods/helpers/openAppSettings';
import log from '../../../../lib/methods/helpers/log';
import { useTheme } from '../../../../theme';
import { useRoomContext } from '../../../../views/RoomView/context';
import { MessageInnerContext, useComposerAttachments, useMessageComposerApi, useMicOrSend } from '../../context';
import { useCanUploadFile } from '../../hooks';
import { BaseButton } from './BaseButton';

export const MicOrSendButton = (): ReactElement | null => {
	const { rid, sharing } = useRoomContext();
	const micOrSend = useMicOrSend();
	const attachments = useComposerAttachments();
	const { sendMessage } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();
	const { setRecordingAudio } = useMessageComposerApi();

	const requestPermissionAndStartToRecordAudio = async () => {
		try {
			const { granted } = await requestRecordingPermissionsAsync();
			setRecordingAudio(granted);
		} catch (error) {
			log(error);
			setRecordingAudio(false);
		}
	};

	const startRecording = async () => {
		try {
			const { status, granted, canAskAgain } = await getRecordingPermissionsAsync();
			if (granted) return setRecordingAudio(true);
			if (status === PermissionStatus.UNDETERMINED) return requestPermissionAndStartToRecordAudio();
			if (canAskAgain) return requestPermissionAndStartToRecordAudio();
		} catch (error) {
			log(error);
			setRecordingAudio(false);
			return;
		}

		Alert.alert(
			i18n.t('Microphone_access_needed_to_record_audio'),
			i18n.t('Go_to_your_device_settings_and_allow_microphone'),
			[
				{
					text: i18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: i18n.t('Settings'),
					onPress: openAppSettings
				}
			],
			{ cancelable: false }
		);
	};

	if (micOrSend === 'send' || sharing || attachments.length > 0) {
		return (
			<BaseButton
				onPress={sendMessage}
				testID='message-composer-send'
				accessibilityLabel='Send_message'
				icon='send-filled'
				color={colors.strokeHighlight}
			/>
		);
	}

	if (Message_AudioRecorderEnabled && permissionToUpload) {
		return (
			<BaseButton
				onPress={startRecording}
				testID='message-composer-send-audio'
				accessibilityLabel='Record_audio_message'
				icon='mic'
			/>
		);
	}

	return null;
};
