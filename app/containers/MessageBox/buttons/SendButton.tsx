import React from 'react';

import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import BaseButton from './BaseButton';

interface ISendButton {
	onPress(): void;
}

const SendButton = ({ onPress }: ISendButton) => {
	const { theme } = useTheme();
	return (
		<BaseButton
			onPress={onPress}
			testID='messagebox-send-message'
			accessibilityLabel='Send_message'
			icon='send-filled'
			color={themes[theme].tintColor}
		/>
	);
};

export default SendButton;
