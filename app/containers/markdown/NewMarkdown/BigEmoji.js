import React from 'react';
import { PropTypes } from 'react-native';

import MarkdownEmoji from '../Emoji';

const BigEmoji = ({ value }) => (
	<>
		<MarkdownEmoji literal={value} />
	</>
);

BigEmoji.propTypes = {
	value: PropTypes.string
};

export default BigEmoji;
