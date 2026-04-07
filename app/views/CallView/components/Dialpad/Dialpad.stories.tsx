import React from 'react';
import { View, StyleSheet } from 'react-native';

import Dialpad, { DialpadLandscape } from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		width: 500
	},
	landscapeContainer: {
		width: 700
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
		callId: 'test-id',
		callState: 'active',
		dialpadValue: '',
		...overrides
	});
};

export default {
	title: 'CallView/Dialpad',
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

const LandscapeWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.landscapeContainer}>{children}</View>
);

export const TabletLandscape = () => {
	setStoreState();
	return (
		<LandscapeWrapper>
			<DialpadLandscape testID='dialpad' />
		</LandscapeWrapper>
	);
};

export const TabletLandscapeWithValue = () => {
	setStoreState({ dialpadValue: '1234' });
	return (
		<LandscapeWrapper>
			<DialpadLandscape testID='dialpad' />
		</LandscapeWrapper>
	);
};
