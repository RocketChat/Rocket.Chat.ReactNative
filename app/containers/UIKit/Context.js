import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

const styles = StyleSheet.create({
	container: {
		minHeight: 36,
		alignItems: 'center',
		flexDirection: 'row'
	}
});

export const Context = ({ elements, parser }) => (
	<View style={styles.container}>
		{elements.map(element => parser.renderContext(element, BLOCK_CONTEXT.CONTEXT, parser))}
	</View>
);
Context.propTypes = {
	elements: PropTypes.array,
	parser: PropTypes.object
};
