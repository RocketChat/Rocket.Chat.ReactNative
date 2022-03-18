import React from 'react';

import { useColors } from '@app/lib/hooks/useColors';

import BaseButton from './BaseButton';

interface ISendButton {
	onPress(): void;
}

const SendButton = ({ onPress }: ISendButton) => {
	const { colors } = useColors();
	return (
		<BaseButton
			onPress={onPress}
			testID='messagebox-send-message'
			accessibilityLabel='Send_message'
			icon='send-filled'
			color={colors.tintColor}
		/>
	);
};

export default SendButton;
