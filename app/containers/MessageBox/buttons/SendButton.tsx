import React from 'react';

import BaseButton from './BaseButton';
import { themes } from '../../../constants/colors';

interface ISendButton {
	theme: string;
	onPress(): void;
}

const SendButton = React.memo(({ theme, onPress }: ISendButton) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-message'
		accessibilityLabel='Send_message'
		icon='send-filled'
		theme={theme}
		color={themes[theme].tintColor}
	/>
));

export default SendButton;
