import React from 'react';
import PropTypes from 'prop-types';
import EasyMarkdown from 'react-native-easy-markdown'; // eslint-disable-line
import { emojify } from 'react-emojione';

const Markdown = ({ msg }) => {
	if (!msg) {
		return null;
	}
	msg = emojify(msg, { output: 'unicode' });
	return <EasyMarkdown>{msg}</EasyMarkdown>;
};

Markdown.propTypes = {
	msg: PropTypes.string.isRequired
};

export default Markdown;
