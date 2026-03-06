import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet from '@discord/bottom-sheet';

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

const BottomSheetWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.root}>
		<BottomSheet
			index={0}
			snapPoints={['95%']}
			handleComponent={null}
			enablePanDownToClose={false}
			backgroundStyle={{ backgroundColor: 'transparent' }}>
			<View style={styles.root}>{children}</View>
		</BottomSheet>
	</View>
);

export default {
	title: 'NewMediaCall/FilterHeader',
	component: FilterHeader,
	decorators: [
		(Story: React.ComponentType) => (
			<BottomSheetWrapper>
				<Story />
			</BottomSheetWrapper>
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
