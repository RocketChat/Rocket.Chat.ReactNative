/* eslint-disable react/no-array-index-key */
import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Emoji from './Emoji';


const BigEmoji = ({ value }) => (
	<View style={{ flexDirection: 'row' }}>
		{value.map((block, index) => <Emoji key={index} emojiHandle={`:${ block.value.value }:`} isBigEmoji />)}
	</View>
);

BigEmoji.propTypes = {
	value: PropTypes.object
};

export default BigEmoji;
