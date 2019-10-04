import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import { shortnameToUnicode } from 'emoji-toolkit';

import CustomEmoji from '../EmojiPicker/CustomEmoji';

import styles from './styles';

const Emoji = React.memo(({
	emojiName, literal, isMessageContainsOnlyEmoji, getCustomEmoji, baseUrl, customEmojis, style = []
}) => {
	const emojiUnicode = shortnameToUnicode(literal);
	const emoji = getCustomEmoji && getCustomEmoji(emojiName);
	if (emoji && customEmojis) {
		return (
			<CustomEmoji
				baseUrl={baseUrl}
				style={isMessageContainsOnlyEmoji ? styles.customEmojiBig : styles.customEmoji}
				emoji={emoji}
			/>
		);
	}
	return (
		<Text
			style={[
				isMessageContainsOnlyEmoji ? styles.textBig : styles.text,
				...style
			]}
		>
			{emojiUnicode}
		</Text>
	);
});

Emoji.propTypes = {
	emojiName: PropTypes.string,
	literal: PropTypes.string,
	isMessageContainsOnlyEmoji: PropTypes.bool,
	getCustomEmoji: PropTypes.func,
	baseUrl: PropTypes.string,
	customEmojis: PropTypes.bool,
	style: PropTypes.array
};

export default Emoji;
