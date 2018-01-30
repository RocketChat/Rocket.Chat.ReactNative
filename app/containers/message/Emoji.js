import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

export default class Emoji extends React.PureComponent {
	static propTypes = {
		content: PropTypes.string,
		standardEmojiStyle: PropTypes.object,
		customEmojiStyle: PropTypes.object,
		customEmojis: PropTypes.object.isRequired
	};
	render() {
		const {
			content, standardEmojiStyle, customEmojiStyle, customEmojis
		} = this.props;
		const parsedContent = content.replace(/^:|:$/g, '');
		const emojiExtension = customEmojis[parsedContent];
		if (emojiExtension) {
			const emoji = { extension: emojiExtension, content: parsedContent };
			return <CustomEmoji key={content} style={customEmojiStyle} emoji={emoji} />;
		}
		return <Text style={standardEmojiStyle}>{ emojify(`${ content }`, { output: 'unicode' }) }</Text>;
	}
}
