import React from 'react';
import { Text, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';
import { connect } from 'react-redux';
import MarkdownRenderer, { PluginContainer } from 'react-native-markdown-renderer';
import MarkdownFlowdock from 'markdown-it-flowdock';
import styles from './styles';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import MarkdownEmojiPlugin from './MarkdownEmojiPlugin';

// Support <http://link|Text>
const formatText = text =>
	text.replace(
		new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
		(match, url, title) => `[${ title }](${ url })`
	);

@connect(state => ({
	customEmojis: state.customEmojis
}))
export default class Markdown extends React.Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.msg !== this.props.msg;
	}
	render() {
		const {
			msg, customEmojis, style, rules
		} = this.props;
		if (!msg) {
			return null;
		}
		let m = formatText(msg);
		m = emojify(m, { output: 'unicode' });
		m = m.replace(/^\[([^\]]*)\]\(([^)]*)\)/, '').trim();
		return (
			<MarkdownRenderer
				rules={{
					...Platform.OS === 'android' ? {} : {
						paragraph: (node, children) => (
							<Text key={node.key} style={styles.paragraph}>
								{children}
							</Text>
						)
					},
					mention: node => (
						<Text key={node.key} onPress={() => alert(`Username @${ node.content }`)} style={styles.mention}>
							@{node.content}
						</Text>
					),
					hashtag: node => (
						<Text key={node.key} onPress={() => alert(`Room #${ node.content }`)} style={styles.mention}>
							#{node.content}
						</Text>
					),
					emoji: (node) => {
						if (node.children && node.children.length && node.children[0].content) {
							const { content } = node.children[0];
							const emojiExtension = customEmojis[content];
							if (emojiExtension) {
								const emoji = { extension: emojiExtension, content };
								return <CustomEmoji key={node.key} style={styles.customEmoji} emoji={emoji} />;
							}
							return <Text key={node.key}>:{content}:</Text>;
						}
						return null;
					},
					blocklink: () => {},
					...rules
				}}
				style={{
					paragraph: styles.paragraph,
					codeInline: {
						borderWidth: 1,
						borderColor: '#CCCCCC',
						backgroundColor: '#f5f5f5',
						padding: 2,
						borderRadius: 4
					},
					...style
				}}
				plugins={[
					new PluginContainer(MarkdownFlowdock),
					new PluginContainer(MarkdownEmojiPlugin)
				]}
			>{m}
			</MarkdownRenderer>
		);
	}
}

Markdown.propTypes = {
	msg: PropTypes.string,
	customEmojis: PropTypes.object,
	style: PropTypes.any,
	rules: PropTypes.object
};
