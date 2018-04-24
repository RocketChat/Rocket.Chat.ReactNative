import React from 'react';
import { Text, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';
import { connect } from 'react-redux';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

@connect(state => ({
	customEmojis: state.customEmojis
}))
export default class Emoji extends React.PureComponent {
	static propTypes = {
		content: PropTypes.string,
		standardEmojiStyle: Text.propTypes.style,
		customEmojiStyle: ViewPropTypes.style,
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
