import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';

import CustomEmoji from '../EmojiPicker/CustomEmoji';

const Emoji = React.memo(({
	content, standardEmojiStyle, customEmojiStyle, baseUrl, getCustomEmoji
}) => {
	const parsedContent = content.replace(/^:|:$/g, '');
	const emoji = getCustomEmoji(parsedContent);
	if (emoji) {
		return <CustomEmoji key={content} baseUrl={baseUrl} style={customEmojiStyle} emoji={emoji} />;
	}
	return <Text style={standardEmojiStyle}>{ emojify(content, { output: 'unicode' }) }</Text>;
}, () => true);

Emoji.propTypes = {
	content: PropTypes.string,
	standardEmojiStyle: PropTypes.object,
	customEmojiStyle: PropTypes.object,
	baseUrl: PropTypes.string,
	getCustomEmoji: PropTypes.func
};
Emoji.displayName = 'MessageEmoji';

export default Emoji;
