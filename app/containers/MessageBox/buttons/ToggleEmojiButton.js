import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const ToggleEmojiButton = React.memo(({ show, open, close }) => {
	if (show) {
		return (
			<BaseButton
				onPress={close}
				testID='messagebox-close-emoji'
				accessibilityLabel='Close_emoji_selector'
				icon='keyboard'
			/>
		);
	}
	return (
		<BaseButton
			onPress={open}
			testID='messagebox-open-emoji'
			accessibilityLabel='Open_emoji_selector'
			icon='emoji'
		/>
	);
});

ToggleEmojiButton.propTypes = {
	show: PropTypes.bool,
	open: PropTypes.func.isRequired,
	close: PropTypes.func.isRequired
};

export default ToggleEmojiButton;
