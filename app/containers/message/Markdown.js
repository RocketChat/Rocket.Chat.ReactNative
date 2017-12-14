import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import EasyMarkdown from 'react-native-easy-markdown'; // eslint-disable-line
import SimpleMarkdown from 'simple-markdown';
import { emojify } from 'react-emojione';

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
	}
};

const Markdown = ({ msg }) => {
	if (!msg) {
		return null;
	}
	msg = emojify(msg, { output: 'unicode' });
	return <EasyMarkdown rules={rules}>{msg}</EasyMarkdown>;
};

Markdown.propTypes = {
	msg: PropTypes.string.isRequired
};

export default Markdown;
