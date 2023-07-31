import React, { useContext, useEffect } from 'react';

import { BaseButton } from './BaseButton';
import { MessageComposerContext } from '../../context';
import { useTheme } from '../../../../theme';
import { useAppSelector } from '../../../../lib/hooks';
import { emitter } from '../../emitter';
import { TMicOrSend } from '../../interfaces';

export const MicOrSendButton = () => {
	const { permissionToUpload, sendMessage } = useContext(MessageComposerContext);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();
	const [micOrSend, setMicOrSend] = React.useState<TMicOrSend>('mic');
	// console.log('🚀 ~ file: MicOrSendButton.tsx:15 ~ MicOrSendButton ~ micOrSend:', micOrSend);

	useEffect(() => {
		emitter.on('setMicOrSend', value => setMicOrSend(value));
		return () => emitter.off('setMicOrSend');
	}, [setMicOrSend]);

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
