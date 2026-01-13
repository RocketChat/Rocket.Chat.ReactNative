import React from 'react';
import { View, StyleSheet } from 'react-native';

import CallerInfo from './CallerInfo';
import { CALL_BACKGROUND_COLOR } from '../styles';
import { useCallStore } from '../../../lib/services/voip/useCallStore';

const styles = StyleSheet.create({
	container: {
		backgroundColor: CALL_BACKGROUND_COLOR,
		padding: 24,
		flex: 1,
		minHeight: 300
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

// Helper to set store state for stories
const setStoreState = (contact: { displayName?: string; username?: string; sipExtension?: string }) => {
	useCallStore.setState({
		contact,
		call: {} as any,
		callUUID: 'test-uuid',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: Date.now()
	});
};

export default {
	title: 'CallerInfo',
	component: CallerInfo,
	decorators: [
		(Story: React.ComponentType) => {
			setStoreState({ displayName: 'Bob Burnquist', username: 'bob.burnquist', sipExtension: '2244' });
			return (
				<Wrapper>
					<Story />
				</Wrapper>
			);
		}
	]
};

export const Default = () => <CallerInfo />;

export const WithOnlineStatus = () => <CallerInfo showOnlineStatus />;

export const WithMutedIndicator = () => <CallerInfo isMuted showOnlineStatus />;

export const NoExtension = () => {
	setStoreState({ displayName: 'Alice Attali', username: 'alice.attali' });
	return <CallerInfo showOnlineStatus />;
};

export const UsernameOnly = () => {
	setStoreState({ username: 'john.doe' });
	return <CallerInfo />;
};
