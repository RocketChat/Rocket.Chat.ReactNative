import React from 'react';
import { Text, Platform } from 'react-native';
import PropTypes from 'prop-types';
import EasyMarkdown from 'react-native-easy-markdown'; // eslint-disable-line
import SimpleMarkdown from 'simple-markdown';
import { emojify } from 'react-emojione';

const codeStyle = {
	...Platform.select({
		ios: { fontFamily: 'Courier New' },
		android: { fontFamily: 'monospace' }
	}),
	backgroundColor: '#f8f8f8',
	borderColor: '#cccccc',
	borderWidth: 1,
	borderRadius: 5,
	padding: 5
};

const BlockCode = ({ node, state }) => (
	<Text
		key={state.key}
		style={codeStyle}
	>
		{node.content}
	</Text>
);

const rules = {
	username: {
		order: -1,
		match: SimpleMarkdown.inlineRegex(/@[0-9a-zA-Z-_.]+/),
		parse: capture => ({ content: capture[0] }),
		react: (node, output, state) => ({
			type: 'custom',
			key: state.key,
			props: {
				children: (
					<Text
						key={state.key}
						style={{ color: '#13679a' }}
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
		match: SimpleMarkdown.inlineRegex(/#[0-9a-zA-Z-_.]+/),
		parse: capture => ({ content: capture[0] }),
		react: (node, output, state) => ({
			type: 'custom',
			key: state.key,
			props: {
				children: (
					<Text
						key={state.key}
						style={{ color: '#13679a' }}
						onPress={() => alert('Room')}
					>
						{node.content}
					</Text>
				)
			}
		})
	},
	fence: {
		order: -5,
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
		order: -6,
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
	}
};

const Markdown = ({ msg }) => {
	if (!msg) {
		return null;
	}
	msg = emojify(msg, { output: 'unicode' });
	return (
		<EasyMarkdown
			style={{ marginBottom: 0 }}
			rules={rules}
			markdownStyles={{ code: codeStyle }}
		>{msg}
		</EasyMarkdown>
	);
};

Markdown.propTypes = {
	msg: PropTypes.string.isRequired
};

BlockCode.propTypes = {
	node: PropTypes.object,
	state: PropTypes.object
};

export default Markdown;
