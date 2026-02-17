import React from 'react';
import { View, StyleSheet } from 'react-native';

import MediaCallHeader from './MediaCallHeader';
import { useCallStore } from '../../lib/services/voip/useCallStore';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

const mockCallStartTime = 1713340800000;

// Helper to set store state for stories
const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = {
		state: 'active',
		muted: false,
		held: false,
		contact: {
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: '2244'
		},
		setMuted: () => {},
		setHeld: () => {},
		hangup: () => {},
		reject: () => {},
		emitter: {
			on: () => {},
			off: () => {}
		}
	} as any;

	useCallStore.setState({
		call: mockCall,
		callUUID: 'test-uuid',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: mockCallStartTime,
		contact: {
			id: 'user-1',
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: '2244'
		},
		focused: true,
		remoteMute: false,
		remoteHeld: false,
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'MediaCallHeader',
	component: MediaCallHeader,
	decorators: [
		(Story: React.ComponentType) => (
			<Wrapper>
				<Story />
			</Wrapper>
		)
	]
};

export const NoCall = () => {
	useCallStore.setState({ call: null });
	return <MediaCallHeader />;
};

export const ActiveCall = () => {
	setStoreState({ callState: 'active', callStartTime: mockCallStartTime });
	return <MediaCallHeader />;
};

export const ConnectingCall = () => {
	setStoreState({ callState: 'accepted', callStartTime: null });
	return <MediaCallHeader />;
};

export const Focused = () => {
	setStoreState({ focused: true });
	return <MediaCallHeader />;
};

export const Collapsed = () => {
	setStoreState({ focused: false });
	return <MediaCallHeader />;
};

export const WithRemoteHeld = () => {
	setStoreState({ callState: 'active', remoteHeld: true });
	return <MediaCallHeader />;
};

export const WithRemoteMuted = () => {
	setStoreState({ callState: 'active', remoteMute: true });
	return <MediaCallHeader />;
};
