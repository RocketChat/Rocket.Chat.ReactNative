import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { SelectedPeerInner } from './SelectedPeer';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		gap: 12
	},
	sectionLabel: {
		fontSize: 13,
		opacity: 0.6
	}
});

const setStoreState = (selectedPeer: ReturnType<typeof usePeerAutocompleteStore.getState>['selectedPeer']) => {
	usePeerAutocompleteStore.setState({
		selectedPeer
	});
};

const userPeer: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
	username: 'alice.johnson'
};

const sipPeer: TPeerItem = {
	type: 'sip',
	value: '+5511999999999',
	label: '+55 11 99999-9999'
};

const longUsernamePeer: TPeerItem = {
	type: 'user',
	value: 'user-2',
	label: 'Long display name to validate text truncation behavior for SelectedPeer in narrow widths',
	username: 'this.is.a.very.long.username.for.storybook.preview'
};

export default {
	title: 'NewMediaCall/SelectedPeer',
	component: SelectedPeerInner
};

export const All = () => (
	<View style={styles.container}>
		<Text style={styles.sectionLabel}>User variant</Text>
		<SelectedPeerInner selectedPeer={userPeer} />
		<Text style={styles.sectionLabel}>SIP variant</Text>
		<SelectedPeerInner selectedPeer={sipPeer} />
		<Text style={styles.sectionLabel}>Long username variant</Text>
		<SelectedPeerInner selectedPeer={longUsernamePeer} />
	</View>
);

export const User = () => {
	setStoreState(userPeer);
	return (
		<View style={styles.container}>
			<Text style={styles.sectionLabel}>User variant</Text>
			<SelectedPeerInner selectedPeer={userPeer} />
		</View>
	);
};

export const Sip = () => {
	setStoreState(sipPeer);
	return (
		<View style={styles.container}>
			<Text style={styles.sectionLabel}>SIP variant</Text>
			<SelectedPeerInner selectedPeer={sipPeer} />
		</View>
	);
};

export const LongUsername = () => {
	setStoreState(longUsernamePeer);
	return (
		<View style={styles.container}>
			<Text style={styles.sectionLabel}>Long username variant</Text>
			<SelectedPeerInner selectedPeer={longUsernamePeer} />
		</View>
	);
};
