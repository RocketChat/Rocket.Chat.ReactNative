import React from 'react';

import * as ActionSheetModule from '../ActionSheet';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { CreateCall } from './CreateCall';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';

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

const setStoreState = (selectedPeer: ReturnType<typeof usePeerAutocompleteStore.getState>['selectedPeer']) => {
	usePeerAutocompleteStore.setState({ selectedPeer });
};

const userPeer: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
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
