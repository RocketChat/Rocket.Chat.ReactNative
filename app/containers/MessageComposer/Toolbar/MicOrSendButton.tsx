import React, { useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MicOrSendContext } from '../context';
import { useTheme } from '../../../theme';

export const MicOrSendButton = () => {
	const { micOrSend } = useContext(MicOrSendContext);
	const { colors } = useTheme();

	if (micOrSend === 'send') {
		return (
			<BaseButton
				onPress={() => alert('tbd')}
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
