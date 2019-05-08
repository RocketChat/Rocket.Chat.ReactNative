import React from 'react';
import { Text, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';

import CustomEmoji from '../EmojiPicker/CustomEmoji';
import RocketChat from '../../lib/rocketchat';

// FIXME: missing improvement
export default class Emoji extends React.PureComponent {
	static propTypes = {
		content: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		standardEmojiStyle: Text.propTypes.style,
		customEmojiStyle: ViewPropTypes.style
	}

	render() {
		const {
			content, standardEmojiStyle, customEmojiStyle, baseUrl
		} = this.props;
		const parsedContent = content.replace(/^:|:$/g, '');
		const emojiExtension = RocketChat.getCustomEmojiFromLocal(parsedContent);
		if (emojiExtension) {
			const emoji = { extension: emojiExtension, content: parsedContent };
			return <CustomEmoji key={content} baseUrl={baseUrl} style={customEmojiStyle} emoji={emoji} />;
		}
		return <Text style={standardEmojiStyle}>{ emojify(content, { output: 'unicode' }) }</Text>;
	}
}
