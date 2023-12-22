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

	const startRecording = async () => {
		const permission = await Audio.requestPermissionsAsync();
		if (permission.granted) {
			setRecordingAudio(true);
		}
	};

	if (micOrSend === 'send' || sharing) {
		return (
			<BaseButton
				onPress={sendMessage}
				testID='message-composer-send'
				accessibilityLabel='Send_message'
				icon='send-filled'
				color={colors.buttonBackgroundPrimaryDefault}
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
