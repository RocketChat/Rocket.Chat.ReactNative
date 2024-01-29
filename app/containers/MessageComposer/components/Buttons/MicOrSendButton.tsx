import { Audio } from 'expo-av';
import React, { useContext } from 'react';
import { Alert } from 'react-native';

import i18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks';
import { useUserPreferences } from '../../../../lib/methods';
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

	const [alreadyAskedForAudioPermission, setAskedForAudioPermission] = useUserPreferences<boolean>(
		'ALREADY_ASKED_FOR_AUDIO_PERMISSION'
	);

	const requestPermissionAndStartToRecordAudio = async (askedPermission: boolean) => {
		// request permission
		const { granted } = await Audio.requestPermissionsAsync();
		if (granted) {
			if (askedPermission) {
				setRecordingAudio(true);
			} else {
				// double check on permission
				await Audio.requestPermissionsAsync();
				setRecordingAudio(true);
			}
		}
	};

	const startRecording = async () => {
		if (!alreadyAskedForAudioPermission) {
			requestPermissionAndStartToRecordAudio(false);
			setAskedForAudioPermission(true);
			return;
		}
		const permission = await Audio.getPermissionsAsync();
		if (permission.granted) {
			setRecordingAudio(true);
		} else if (permission.canAskAgain) {
			requestPermissionAndStartToRecordAudio(true);
		} else {
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
		}
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
