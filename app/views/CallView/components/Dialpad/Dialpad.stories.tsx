import React from 'react';
import { View, StyleSheet } from 'react-native';

import Dialpad from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import * as callLayoutModule from '../../useCallLayoutMode';

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

// Forces `useCallLayoutMode` to return the requested layout mode for the
// duration of the render. Under jest the hook is mocked at module level (see
// Dialpad.test.tsx), so this just calls `mockReturnValue`. In the Storybook UI
// the hook is the real implementation; snapshot stories run only under jest, so
// the no-op fallback is intentional.
const forceLayoutMode = (layoutMode: 'wide' | 'narrow') => {
	const fn = callLayoutModule.useCallLayoutMode as unknown as { mockReturnValue?: (v: unknown) => void };
	if (fn.mockReturnValue) {
		fn.mockReturnValue({ layoutMode });
	}
};

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

export const Default = () => {
	forceLayoutMode('narrow');
	return <Dialpad testID='dialpad' />;
};

export const WithValue = () => {
	forceLayoutMode('narrow');
	setStoreState({ dialpadValue: '123' });
	return <Dialpad testID='dialpad' />;
};

const LandscapeWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.landscapeContainer}>{children}</View>
);

export const TabletLandscape = () => {
	forceLayoutMode('wide');
	setStoreState();
	return (
		<LandscapeWrapper>
			<Dialpad testID='dialpad' />
		</LandscapeWrapper>
	);
};

export const TabletLandscapeWithValue = () => {
	forceLayoutMode('wide');
	setStoreState({ dialpadValue: '1234' });
	return (
		<LandscapeWrapper>
			<Dialpad testID='dialpad' />
		</LandscapeWrapper>
	);
};
