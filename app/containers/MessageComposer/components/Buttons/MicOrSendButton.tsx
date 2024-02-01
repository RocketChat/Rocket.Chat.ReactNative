import { Audio } from 'expo-av';
import React, { useContext } from 'react';
import { Alert } from 'react-native';
import { PermissionStatus } from 'expo-camera';

import i18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks';
import { openAppSettings } from '../../../../lib/methods/helpers/openAppSettings';
import { useTheme } from '../../../../theme';
import { useRoomContext } from '../../../../views/RoomView/context';
import { MessageInnerContext, useMessageComposerApi, useMicOrSend } from '../../context';
import { useCanUploadFile } from '../../hooks';
import { BaseButton } from './BaseButton';

export const MicOrSendButton = (): React.ReactElement | null => {
	const { rid, sharing } = useRoomContext();
	const micOrSend = useMicOrSend();
	const { sendMessage } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();
	const { setRecordingAudio } = useMessageComposerApi();

	const requestPermissionAndStartToRecordAudio = () =>
		Audio.requestPermissionsAsync()
			.then(({ granted }) => setRecordingAudio(granted))
			.catch(() => {});

	const startRecording = async () => {
		const { status, granted, canAskAgain } = await Audio.getPermissionsAsync();
		if (granted) return setRecordingAudio(true);
		if (status === PermissionStatus.UNDETERMINED) return requestPermissionAndStartToRecordAudio();
		if (canAskAgain) return requestPermissionAndStartToRecordAudio();

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

	if (micOrSend === 'send' || sharing) {
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
				accessibilityLabel='Send_audio_message'
				icon='microphone'
			/>
		);
	}

	return null;
};
