import React from 'react';
import { Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import { emojify } from 'react-emojione';
import MarkdownRenderer, { PluginContainer } from 'react-native-markdown-renderer';
import MarkdownFlowdock from 'markdown-it-flowdock';

import styles from './styles';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import MarkdownEmojiPlugin from './MarkdownEmojiPlugin';
import I18n from '../../i18n';

const EmojiPlugin = new PluginContainer(MarkdownEmojiPlugin);
const MentionsPlugin = new PluginContainer(MarkdownFlowdock);
const plugins = [EmojiPlugin, MentionsPlugin];

// Support <http://link|Text>
const formatText = text => text.replace(
	new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
	(match, url, title) => `[${ title }](${ url })`
);

const Markdown = React.memo(({
	msg, style, rules, baseUrl, username, isEdited, numberOfLines, mentions, channels, getCustomEmoji, useMarkdown = true
}) => {
	if (!msg) {
		return null;
	}
	let m = formatText(msg);
	if (m) {
		m = emojify(m, { output: 'unicode' });
	}
	m = m.replace(/^\[([^\]]*)\]\(([^)]*)\)/, '').trim();
	if (numberOfLines > 0) {
		m = m.replace(/[\n]+/g, '\n').trim();
	}

	if (!useMarkdown) {
		return <Text style={styles.text} numberOfLines={numberOfLines}>{m}</Text>;
	}

	return (
		<MarkdownRenderer
			rules={{
				paragraph: (node, children) => (
					<Text key={node.key} style={styles.paragraph} numberOfLines={numberOfLines}>
						{children}
						{isEdited ? <Text style={styles.edited}> ({I18n.t('edited')})</Text> : null}
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
					if (mentions && mentions.length && mentions.findIndex(mention => mention.username === content) !== -1) {
						return (
							<Text style={mentionStyle} key={key}>
								&nbsp;{content}&nbsp;
							</Text>
						);
					}
					return `@${ content }`;
				},
				hashtag: (node) => {
					const { content, key } = node;
					if (channels && channels.length && channels.findIndex(channel => channel.name === content) !== -1) {
						return (
							<Text key={key} style={styles.mention}>
								&nbsp;#{content}&nbsp;
							</Text>
						);
					}
					return `#${ content }`;
				},
				emoji: (node) => {
					if (node.children && node.children.length && node.children[0].content) {
						const { content } = node.children[0];
						const emoji = getCustomEmoji && getCustomEmoji(content);
						if (emoji) {
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
			plugins={plugins}
		>{m}
		</MarkdownRenderer>
	);
}, (prevProps, nextProps) => prevProps.msg === nextProps.msg);

Markdown.propTypes = {
	msg: PropTypes.string,
	username: PropTypes.string,
	baseUrl: PropTypes.string,
	style: PropTypes.any,
	rules: PropTypes.object,
	isEdited: PropTypes.bool,
	numberOfLines: PropTypes.number,
	useMarkdown: PropTypes.bool,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	getCustomEmoji: PropTypes.func
};
Markdown.displayName = 'MessageMarkdown';

export default Markdown;
