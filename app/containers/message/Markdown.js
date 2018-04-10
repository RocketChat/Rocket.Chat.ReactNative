import React from 'react';
import { Text, StyleSheet, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import EasyMarkdown from 'react-native-easy-markdown'; // eslint-disable-line
import SimpleMarkdown from 'simple-markdown';
import { emojify } from 'react-emojione';
import styles from './styles';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

const BlockCode = ({ node, state }) => (
	<Text
		key={state.key}
		style={styles.codeStyle}
	>
		{node.content}
	</Text>
);
const mentionStyle = { color: '#13679a' };

const Markdown = ({
	msg, customEmojis = {}, style, markdownStyle, customRules, renderInline
}) => {
	if (!msg) {
		return null;
	}
	msg = emojify(msg, { output: 'unicode' });

	const defaultRules = {
		username: {
			order: -1,
			match: SimpleMarkdown.inlineRegex(/^@[0-9a-zA-Z-_.]+/),
			parse: capture => ({ content: capture[0] }),
			react: (node, output, state) => ({
				type: 'custom',
				key: state.key,
				props: {
					children: (
						<Text
							key={state.key}
							style={mentionStyle}
							onPress={() => alert('Username')}
						>
							{node.content}
						</Text>
					)
				}
			})
		},
		heading: {
			order: -2,
			match: SimpleMarkdown.inlineRegex(/^#[0-9a-zA-Z-_.]+/),
			parse: capture => ({ content: capture[0] }),
			react: (node, output, state) => ({
				type: 'custom',
				key: state.key,
				props: {
					children: (
						<Text
							key={state.key}
							style={mentionStyle}
							onPress={() => alert('Room')}
						>
							{node.content}
						</Text>
					)
				}
			})
		},
		fence: {
			order: -3,
			match: SimpleMarkdown.blockRegex(/^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n *)+\n/),
			parse: capture => ({
				lang: capture[2] || undefined,
				content: capture[3]
			}),
			react: (node, output, state) => ({
				type: 'custom',
				key: state.key,
				props: {
					children: (
						<BlockCode key={state.key} node={node} state={state} />
					)
				}
			})
		},
		blockCode: {
			order: -4,
			match: SimpleMarkdown.blockRegex(/^(```)\s*([\s\S]*?[^`])\s*\1(?!```)/),
			parse: capture => ({ content: capture[2] }),
			react: (node, output, state) => ({
				type: 'custom',
				key: state.key,
				props: {
					children: (
						<BlockCode key={state.key} node={node} state={state} />
					)
				}
			})
		},
		customEmoji: {
			order: -5,
			match: SimpleMarkdown.inlineRegex(/^:([0-9a-zA-Z-_.]+):/),
			parse: capture => ({ content: capture }),
			react: (node, output, state) => {
				const element = {
					type: 'custom',
					key: state.key,
					props: {
						children: <Text key={state.key}>{node.content[0]}</Text>
					}
				};
				const content = node.content[1];
				const emojiExtension = customEmojis[content];
				if (emojiExtension) {
					const emoji = { extension: emojiExtension, content };
					element.props.children = (
						<CustomEmoji key={state.key} style={styles.customEmoji} emoji={emoji} />
					);
				}
				return element;
			}
		}
	};

	const codeStyle = StyleSheet.flatten(styles.codeStyle);
	style = StyleSheet.flatten(style);
	return (
		<EasyMarkdown
			style={{ marginBottom: 0, ...style }}
			markdownStyles={{ code: codeStyle, ...markdownStyle }}
			rules={{ ...defaultRules, ...customRules }}
			renderInline={renderInline}
		>{msg}
		</EasyMarkdown>
	);
};

Markdown.propTypes = {
	msg: PropTypes.string.isRequired,
	customEmojis: PropTypes.object,
	// eslint-disable-next-line react/no-typos
	style: ViewPropTypes.style,
	markdownStyle: PropTypes.object,
	customRules: PropTypes.object,
	renderInline: PropTypes.bool
};

BlockCode.propTypes = {
	node: PropTypes.object,
	state: PropTypes.object
};

export default Markdown;
