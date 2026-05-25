import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { PeerList } from './PeerList';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	}
});

const mixedOptions: TPeerItem[] = [
	{
		type: 'sip',
		value: '+5511988887777',
		label: '+55 11 98888-7777'
	},
	{
		type: 'user',
		value: 'user-1',
		label: 'Alice Johnson',
		username: 'alice.johnson'
	},
	{
		type: 'user',
		value: 'user-2',
		label: 'Long display name to validate text truncation behavior for PeerItem in narrow widths',
		username: 'very.long.username'
	},
	{
		type: 'user',
		value: 'user-3',
		label: 'Bob Smith',
		username: 'bob.smith'
	}
];

const setStoreState = (options: TPeerItem[]) => {
	usePeerAutocompleteStore.setState({
		options,
		selectedPeer: null
	});
};

export default {
	title: 'NewMediaCall/PeerList',
	component: PeerList
};

export const All = () => {
	setStoreState(mixedOptions);
	return (
		<View style={styles.container}>
			<PeerList />
		</View>
	);
};
