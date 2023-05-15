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
				testID='messagebox-cancel-editing'
				accessibilityLabel='TBD'
				icon='send-filled'
				color={colors.buttonBackgroundPrimaryDefault}
			/>
		);
	}

	return (
		<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='microphone' />
	);
};
