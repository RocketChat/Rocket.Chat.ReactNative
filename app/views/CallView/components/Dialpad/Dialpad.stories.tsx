import React from 'react';
import { View, StyleSheet } from 'react-native';

import Dialpad from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		alignItems: 'center',
		minHeight: 500
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

// Helper to set store state for stories - call with sendDTMF so dialpad buttons work
const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = {
		state: 'active',
		muted: false,
		held: false,
		contact: {},
		sendDTMF: () => {},
		emitter: { on: () => {}, off: () => {} }
	} as any;

	useCallStore.setState({
		call: mockCall,
		callUUID: 'test-uuid',
		callState: 'active',
		dialpadValue: '',
		...overrides
	});
};

export default {
	title: 'Dialpad',
	component: Dialpad,
	decorators: [
		(Story: React.ComponentType) => {
			setStoreState();
			return (
				<Wrapper>
					<Story />
				</Wrapper>
			);
		}
	]
};

export const Default = () => <Dialpad testID='dialpad' />;

export const WithValue = () => {
	setStoreState({ dialpadValue: '123' });
	return <Dialpad testID='dialpad' />;
};
