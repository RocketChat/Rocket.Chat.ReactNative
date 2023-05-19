import React, { useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MessageComposerContext } from '../context';
import { useTheme } from '../../../theme';

export const MicOrSendButton = () => {
	const { micOrSend, sendMessage } = useContext(MessageComposerContext);
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

	return (
		<BaseButton
			onPress={() => alert('tbd')}
			testID='message-composer-send-audio'
			accessibilityLabel='Send_audio_message'
			icon='microphone'
		/>
	);
};
