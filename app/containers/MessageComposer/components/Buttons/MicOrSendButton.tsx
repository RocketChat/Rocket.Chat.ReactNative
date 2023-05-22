import React, { useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MessageComposerContext } from '../../context';
import { useTheme } from '../../../../theme';
import { useAppSelector } from '../../../../lib/hooks';

export const MicOrSendButton = () => {
	const { micOrSend, permissionToUpload, sendMessage } = useContext(MessageComposerContext);
	const { Message_AudioRecorderEnabled } = useAppSelector(state => state.settings);
	const { colors } = useTheme();

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
