import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { themes } from '../../constants/colors';

import styles from './styles';

const Emoji = React.memo(({
	literal, isMessageContainsOnlyEmoji, getCustomEmoji, baseUrl, customEmojis = true, style = {}, theme
}) => {
	const emojiUnicode = shortnameToUnicode(literal);
	const emoji = getCustomEmoji && getCustomEmoji(literal.replace(/:/g, ''));
	if (emoji && customEmojis) {
		return (
			<CustomEmoji
				baseUrl={baseUrl}
				style={[
					isMessageContainsOnlyEmoji ? styles.customEmojiBig : styles.customEmoji,
					style
				]}
				emoji={emoji}
			/>
		);
	}
	return (
		<Text
			style={[
				{ color: themes[theme].bodyText },
				isMessageContainsOnlyEmoji ? styles.textBig : styles.text,
				style
			]}
		>
			{emojiUnicode}
		</Text>
	);
});

Emoji.propTypes = {
	literal: PropTypes.string,
	isMessageContainsOnlyEmoji: PropTypes.bool,
	getCustomEmoji: PropTypes.func,
	baseUrl: PropTypes.string,
	customEmojis: PropTypes.bool,
	style: PropTypes.object,
	theme: PropTypes.string
};

export default Emoji;
