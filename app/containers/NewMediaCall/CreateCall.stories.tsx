import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as ActionSheetModule from '../ActionSheet';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { CreateCall } from './CreateCall';

const mediaSession = mediaSessionInstance as unknown as { startCall: (...args: unknown[]) => void };
mediaSession.startCall = () => {};

try {
	Object.defineProperty(ActionSheetModule, 'hideActionSheetRef', {
		value: () => {},
		writable: true
	});
} catch {
	// noop: in environments where export is not re-definable,
	// the original hideActionSheetRef is already safe with optional chaining.
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		gap: 12
	},
	label: {
		fontSize: 13,
		opacity: 0.6
	}
});

const setStoreState = (selectedPeer: ReturnType<typeof usePeerAutocompleteStore.getState>['selectedPeer']) => {
	usePeerAutocompleteStore.setState({ selectedPeer });
};

const userPeer = {
	userId: 'user-1',
	displayName: 'Alice Johnson',
	username: 'alice.johnson'
};

export default {
	title: 'NewMediaCall/CreateCall',
	component: CreateCall
};

export const Disabled = () => {
	setStoreState(null);
	return <CreateCall />;
};

export const Enabled = () => {
	setStoreState(userPeer);
	return <CreateCall />;
};
