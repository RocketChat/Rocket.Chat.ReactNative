import React from 'react';
import { Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';
import MarkdownRenderer, { PluginContainer } from 'react-native-markdown-renderer';
import MarkdownFlowdock from 'markdown-it-flowdock';
import styles from './styles';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import MarkdownEmojiPlugin from './MarkdownEmojiPlugin';

// Support <http://link|Text>
const formatText = text => text.replace(
	new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
	(match, url, title) => `[${ title }](${ url })`
);

export default class Markdown extends React.Component {
	shouldComponentUpdate(nextProps) {
		const { msg } = this.props;
		return nextProps.msg !== msg;
	}

	render() {
		const {
			msg, customEmojis, style, rules, baseUrl, username, edited
		} = this.props;
		if (!msg) {
			return null;
		}
		let m = formatText(msg);
		if (m) {
			m = emojify(m, { output: 'unicode' });
		}
		m = m.replace(/^\[([^\]]*)\]\(([^)]*)\)/, '').trim();
		return (
			<MarkdownRenderer
				rules={{
					paragraph: (node, children) => (
						// eslint-disable-next-line
						<Text key={node.key} style={styles.paragraph}>
							{children}
							{edited ? <Text style={styles.edited}> (edited)</Text> : null}
						</Text>
					),
					mention: (node) => {
						const { content, key } = node;
						let mentionStyle = styles.mention;
						if (content === 'all' || content === 'here') {
							mentionStyle = {
								...mentionStyle,
								...styles.mentionAll
							};
						} else if (content === username) {
							mentionStyle = {
								...mentionStyle,
								...styles.mentionLoggedUser
							};
						}
						return (
							<Text style={mentionStyle} key={key}>
								&nbsp;{content}&nbsp;
							</Text>
						);
					},
					hashtag: node => (
						<Text key={node.key} style={styles.mention}>
							&nbsp;#{node.content}&nbsp;
						</Text>
					),
					emoji: (node) => {
						if (node.children && node.children.length && node.children[0].content) {
							const { content } = node.children[0];
							const emojiExtension = customEmojis[content];
							if (emojiExtension) {
								const emoji = { extension: emojiExtension, content };
								return <CustomEmoji key={node.key} baseUrl={baseUrl} style={styles.customEmoji} emoji={emoji} />;
							}
							return <Text key={node.key}>:{content}:</Text>;
						}
						return null;
					},
					hardbreak: () => null,
					blocklink: () => null,
					image: node => (
						<Image key={node.key} style={styles.inlineImage} source={{ uri: node.attributes.src }} />
					),
					...rules
				}}
				style={{
					paragraph: styles.paragraph,
					text: styles.text,
					codeInline: styles.codeInline,
					codeBlock: styles.codeBlock,
					link: styles.link,
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
	username: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	customEmojis: PropTypes.object.isRequired,
	style: PropTypes.any,
	rules: PropTypes.object,
	edited: PropTypes.bool
};
