import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { PeerItem } from './PeerItem';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		gap: 8
	},
	label: {
		fontSize: 13,
		opacity: 0.6
	}
});

const onSelectOption = () => {};

const userItem: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
	username: 'alice.johnson'
};

const sipItem: TPeerItem = {
	type: 'sip',
	value: '+5511999999999',
	label: '+55 11 99999-9999'
};

const longLabelItem: TPeerItem = {
	type: 'user',
	value: 'user-2',
	label: 'Long display name to validate text truncation behavior for PeerItem in narrow widths',
	username: 'very.long.username'
};

export default {
	title: 'NewMediaCall/PeerItem',
	component: PeerItem
};

export const All = () => (
	<View style={styles.container}>
		<Text style={styles.label}>User</Text>
		<PeerItem item={userItem} onSelectOption={onSelectOption} />

		<Text style={styles.label}>SIP</Text>
		<PeerItem item={sipItem} onSelectOption={onSelectOption} />

		<Text style={styles.label}>Long label</Text>
		<PeerItem item={longLabelItem} onSelectOption={onSelectOption} />
	</View>
);
