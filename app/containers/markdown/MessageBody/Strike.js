/* eslint-disable react/no-array-index-key */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import Bold from './Bold';
import Italic from './Italic';
import Plain from './Plain';

const styles = StyleSheet.create({
	text: {
		textDecorationLine: 'line-through'
	}
});

const Strike = ({ value }) => (
	<Text style={styles.text}>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <Plain key={index} value={block.value} />;
				case 'BOLD':
					return <Bold key={index} value={block.value} />;
				case 'ITALIC':
					return <Italic key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</Text>
);

Strike.propTypes = {
	value: PropTypes.string
};

export default Strike;
