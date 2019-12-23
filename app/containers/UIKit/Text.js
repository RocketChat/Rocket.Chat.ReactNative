import React from 'react';
import PropTypes from 'prop-types';

import Markdown from '../markdown';

export const Text = ({ text, type, theme = 'light' } = { text: '' }) => {
	const useMarkdown = type === 'mrkdwn';
	return <Markdown msg={text} theme={theme} useMarkdown={useMarkdown} />;
};
Text.propTypes = {
	text: PropTypes.string,
	type: PropTypes.string,
	theme: PropTypes.string
};
