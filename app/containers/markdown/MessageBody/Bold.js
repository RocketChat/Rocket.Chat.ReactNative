/* eslint-disable react/no-array-index-key */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import Strike from './Strike';
import Italic from './Italic';
import Plain from './Plain';

const styles = StyleSheet.create({
	text: {
		fontWeight: 'bold'
	}
});

const Bold = ({ value }) => (
	<Text style={styles.text}>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <Plain value={block.value} />;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'ITALIC':
					return <Italic key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</Text>
);

Bold.propTypes = {
	value: PropTypes.string
};

export default Bold;
