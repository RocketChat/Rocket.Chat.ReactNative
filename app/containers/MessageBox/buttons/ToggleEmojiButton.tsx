import React from 'react';

import BaseButton from './BaseButton';

interface IToggleEmojiButton {
	theme: string;
	show: boolean;
	open(): void;
	close(): void;
}

const ToggleEmojiButton = React.memo(({ theme, show, open, close }: IToggleEmojiButton) => {
	if (show) {
		return (
			<BaseButton
				onPress={close}
				testID='messagebox-close-emoji'
				accessibilityLabel='Close_emoji_selector'
				icon='keyboard'
				theme={theme}
			/>
		);
	}
	return (
		<BaseButton
			onPress={open}
			testID='messagebox-open-emoji'
			accessibilityLabel='Open_emoji_selector'
			icon='emoji'
			theme={theme}
		/>
	);
});

export default ToggleEmojiButton;
