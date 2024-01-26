import React, { useContext } from 'react';
import { Audio } from 'expo-av';

import { BaseButton } from './BaseButton';
import { MessageInnerContext, useMessageComposerApi, useMicOrSend } from '../../context';
import { useTheme } from '../../../../theme';
import { useAppSelector } from '../../../../lib/hooks';
import { useCanUploadFile } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';

export const MicOrSendButton = () => {
	const { rid, sharing } = useRoomContext();
	const micOrSend = useMicOrSend();
	const { sendMessage } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();
	const { setRecordingAudio } = useMessageComposerApi();
	const [permissionResponse, requestPermission] = Audio.usePermissions();

	const requestPermissionAndStartToRecordAudio = async () => {
		try {
			const permission = await requestPermission();
			if (permission.status === Audio.PermissionStatus.GRANTED) {
				// hack to avoid permission not set before recording
				setTimeout(() => {
					setRecordingAudio(true);
				}, 100);
			} else {
				// TODO: Implement this function to show user-friendly error message and why we need permission
			}
		} catch (error) {
			// TODO: ask user to close and open app again
			console.error('Error requesting permission:', error);
		}
	};

	const startRecording = async () => {
		const status = permissionResponse?.status;
		switch (status) {
			case Audio.PermissionStatus.GRANTED:
				setRecordingAudio(true);
				break;
			case Audio.PermissionStatus.UNDETERMINED:
				await requestPermissionAndStartToRecordAudio();
				break;
			case Audio.PermissionStatus.DENIED:
				if (permissionResponse?.canAskAgain) {
					await requestPermissionAndStartToRecordAudio();
				} else {
					// TODO: Implement this function to guide users to enable permission in settings
				}
				break;
			default:
				console.log('Permission to record audio denied or an unknown error occurred');
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
