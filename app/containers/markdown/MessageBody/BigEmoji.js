/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';

import Emoji from './Emoji';


const BigEmoji = ({ value }) => (
	<>
		{value.map((block, index) => <Emoji key={index} value={block.value.value} isBigEmoji />)}
	</>
);

BigEmoji.propTypes = {
	value: PropTypes.object
};

export default BigEmoji;
