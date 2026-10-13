import { View, StyleSheet } from 'react-native';
import { type ComponentType, type ReactNode } from 'react';

import MediaCallHeader from './MediaCallHeader';
import { useCallStore } from '~/lib/services/voip/useCallStore';

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
			sipExtension: ''
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
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: mockCallStartTime,
		contact: {
			id: 'user-1',
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: ''
		},
		roomId: 'story-room-rid',
		focused: true,
		remoteMute: false,
		remoteHeld: false,
		...overrides
	});
};

const Wrapper = ({ children }: { children: ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'MediaCallHeader',
	component: MediaCallHeader,
	decorators: [
		(Story: ComponentType) => (
			<Wrapper>
				<Story />
			</Wrapper>
		)
	]
};

export const NoCall = {
	beforeEach: () => {
		useCallStore.setState({ call: null });
	}
};

export const ActiveCall = {
	beforeEach: () => {
		setStoreState({ callState: 'active', callStartTime: mockCallStartTime });
	}
};

export const ConnectingCall = {
	beforeEach: () => {
		setStoreState({ callState: 'accepted', callStartTime: null });
	}
};

export const Focused = {
	beforeEach: () => {
		setStoreState({ focused: true });
	}
};

export const Collapsed = {
	beforeEach: () => {
		setStoreState({ focused: false });
	}
};

export const WithRemoteHeld = {
	beforeEach: () => {
		setStoreState({ callState: 'active', remoteHeld: true });
	}
};

export const WithRemoteMuted = {
	beforeEach: () => {
		setStoreState({ callState: 'active', remoteMute: true });
	}
};
