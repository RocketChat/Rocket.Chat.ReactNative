import React from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet from '@discord/bottom-sheet';

import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { NewMediaCall } from './NewMediaCall';

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#ccc'
	},
	container: {
		flex: 1,
		padding: 16
	}
});

const mockUserOptions = [
	{
		type: 'user' as const,
		value: 'user-1',
		label: 'Alice Johnson',
		username: 'alice.johnson'
	},
	{
		type: 'user' as const,
		value: 'user-2',
		label: 'Bob Smith',
		username: 'bob.smith'
	}
];

const setStoreByVariant = (variant: 'empty' | 'searching' | 'userSelected' | 'sipSelected') => {
	if (variant === 'empty') {
		usePeerAutocompleteStore.setState({
			filter: '',
			options: [],
			selectedPeer: null
		});
		return;
	}

	if (variant === 'searching') {
		usePeerAutocompleteStore.setState({
			filter: 'al',
			options: mockUserOptions,
			selectedPeer: null
		});
		return;
	}

	if (variant === 'userSelected') {
		usePeerAutocompleteStore.setState({
			filter: '',
			options: [],
			selectedPeer: {
				type: 'user',
				value: 'alice.johnson',
				label: 'Alice Johnson',
				username: 'alice.johnson'
			}
		});
		return;
	}

	usePeerAutocompleteStore.setState({
		filter: '',
		options: [],
		selectedPeer: { type: 'sip', value: '+5511999999999', label: '+55 11 99999-9999' }
	});
};

const BottomSheetWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.root}>
		<BottomSheet
			index={0}
			snapPoints={['50%']}
			handleComponent={null}
			enablePanDownToClose={false}
			backgroundStyle={{ backgroundColor: 'transparent' }}>
			<View style={styles.root}>{children}</View>
		</BottomSheet>
	</View>
);

export default {
	title: 'NewMediaCall/NewMediaCall',
	component: NewMediaCall,
	decorators: [
		(Story: React.ComponentType) => (
			<BottomSheetWrapper>
				<Story />
			</BottomSheetWrapper>
		)
	]
};

export const Empty = () => {
	setStoreByVariant('empty');
	return (
		<View style={styles.container}>
			<NewMediaCall />
		</View>
	);
};

export const Searching = () => {
	setStoreByVariant('searching');
	return (
		<View style={styles.container}>
			<NewMediaCall />
		</View>
	);
};

export const UserSelected = () => {
	setStoreByVariant('userSelected');
	return (
		<View style={styles.container}>
			<NewMediaCall />
		</View>
	);
};

export const SipSelected = () => {
	setStoreByVariant('sipSelected');
	return (
		<View style={styles.container}>
			<NewMediaCall />
		</View>
	);
};
