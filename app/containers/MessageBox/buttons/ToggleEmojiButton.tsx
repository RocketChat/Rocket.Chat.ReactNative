import React from 'react';

import BaseButton from './BaseButton';

interface IToggleEmojiButton {
	show: boolean;
	open(): void;
	close(): void;
}

const ToggleEmojiButton = ({ show, open, close }: IToggleEmojiButton) => {
	if (show) {
		return (
			<BaseButton onPress={close} testID='messagebox-close-emoji' accessibilityLabel='Close_emoji_selector' icon='keyboard' />
		);
	}
	return <BaseButton onPress={open} testID='messagebox-open-emoji' accessibilityLabel='Open_emoji_selector' icon='emoji' />;
};

export default ToggleEmojiButton;
