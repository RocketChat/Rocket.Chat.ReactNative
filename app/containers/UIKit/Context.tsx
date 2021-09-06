import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

const styles = StyleSheet.create({
	container: {
		minHeight: 36,
		alignItems: 'center',
		flexDirection: 'row'
	}
});

export const Context = ({ elements, parser }: any) => (
	<View style={styles.container}>
		{elements.map((element: any) => parser.renderContext(element, BLOCK_CONTEXT.CONTEXT, parser))}
	</View>
);

Context.propTypes = {
	elements: PropTypes.array,
	parser: PropTypes.object
};
