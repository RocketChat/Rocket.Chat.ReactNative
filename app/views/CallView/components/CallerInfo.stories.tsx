import { View } from 'react-native';
import type { ReactNode, ComponentType } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import CallerInfo from './CallerInfo';
import { useCallStore } from '../../../lib/services/voip/useCallStore';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		flex: 1,
		minHeight: 300
	}
});

const Wrapper = ({ children }: { children: ReactNode }) => <View style={styles.container}>{children}</View>;

// Helper to set store state for stories
const setStoreState = (contact: { displayName?: string; username?: string; sipExtension?: string }) => {
	useCallStore.setState({
		contact,
		call: {} as any,
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false
	});
};

export default {
	title: 'CallView/CallerInfo',
	component: CallerInfo,
	decorators: [
		(Story: ComponentType) => {
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

export const UsernameOnly = () => {
	setStoreState({ username: 'john.doe' });
	return <CallerInfo />;
};
