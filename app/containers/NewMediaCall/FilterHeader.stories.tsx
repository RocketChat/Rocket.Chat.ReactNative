import React from 'react';
import { View, StyleSheet } from 'react-native';

import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { FilterHeader } from './FilterHeader';

const styles = StyleSheet.create({
	root: {
		flex: 1
	}
});

const setStoreState = (filter: string) => {
	usePeerAutocompleteStore.setState({
		filter,
		selectedPeer: null,
		options: []
	});
};

export default {
	title: 'NewMediaCall/FilterHeader',
	component: FilterHeader,
	decorators: [
		(Story: React.ComponentType) => (
			<View style={styles.root}>
				<Story />
			</View>
		)
	]
};

export const Default = () => {
	setStoreState('');
	return <FilterHeader />;
};

export const WithFilter = () => {
	setStoreState('alice');
	return <FilterHeader />;
};
