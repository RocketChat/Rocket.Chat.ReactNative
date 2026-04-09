import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Container } from './Container';

const styles = StyleSheet.create({
	root: {
		flex: 1
	},
	placeholder: {
		marginTop: 8,
		padding: 12,
		borderRadius: 6,
		backgroundColor: '#efefef'
	}
});

const PlaceholderChildren = () => (
	<View style={styles.placeholder}>
		<Text>Mock children placeholder</Text>
	</View>
);

export default {
	title: 'NewMediaCall/Container',
	component: Container,
	decorators: [
		(Story: React.ComponentType) => (
			<View style={styles.root}>
				<Story />
			</View>
		)
	]
};

export const Default = () => (
	<Container>
		<PlaceholderChildren />
	</Container>
);
