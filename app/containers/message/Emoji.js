import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

const Emoji = React.memo(({
	content, baseUrl, standardEmojiStyle, customEmojiStyle, getCustomEmoji
}) => {
	const parsedContent = content.replace(/^:|:$/g, '');
	const emoji = getCustomEmoji(parsedContent);
	if (emoji) {
		return <CustomEmoji key={content} baseUrl={baseUrl} style={customEmojiStyle} emoji={emoji} />;
	}
	return <Text style={standardEmojiStyle}>{ shortnameToUnicode(content) }</Text>;
}, () => true);

Emoji.propTypes = {
	content: PropTypes.string,
	baseUrl: PropTypes.string,
	standardEmojiStyle: PropTypes.object,
	customEmojiStyle: PropTypes.object,
	getCustomEmoji: PropTypes.func
};
Emoji.displayName = 'MessageEmoji';

export default Emoji;
