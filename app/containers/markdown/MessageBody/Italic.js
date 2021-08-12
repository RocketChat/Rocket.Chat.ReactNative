/* eslint-disable react/no-array-index-key */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import Plain from './Plain';
import Strike from './Strike';
import Bold from './Bold';

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	}
});

const Italic = ({ value }) => (
	<Text style={styles.text}>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <Plain key={index} value={block.value} />;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'BOLD':
					return <Bold key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</Text>
);

Italic.propTypes = {
	value: PropTypes.string
};

export default Italic;
