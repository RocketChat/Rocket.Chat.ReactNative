import React, { useContext, useEffect, useState } from 'react';

import { BaseButton } from './BaseButton';
import { MessageInnerContext } from '../../context';
import { useTheme } from '../../../../theme';
import { useAppSelector } from '../../../../lib/hooks';
import { emitter } from '../../emitter';
import { TMicOrSend } from '../../interfaces';
import { useCanUploadFile } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';

export const MicOrSendButton = () => {
	const { rid } = useRoomContext();
	const { sendMessage } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();
	const [micOrSend, setMicOrSend] = useState<TMicOrSend>('mic');

	useEffect(() => {
		emitter.on('setMicOrSend', value => setMicOrSend(value));
		return () => emitter.off('setMicOrSend');
	}, []);

	if (micOrSend === 'send') {
		return (
			<BaseButton
				onPress={() => sendMessage()}
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
				onPress={() => alert('tbd')}
				testID='message-composer-send-audio'
				accessibilityLabel='Send_audio_message'
				icon='microphone'
			/>
		);
	}

	return null;
};
