import React from 'react';
import { View, StyleSheet } from 'react-native';

import Dialpad from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import {
	ResponsiveLayoutContext,
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED
} from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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

// Provides a ResponsiveLayoutContext with a fixed width so useCallLayoutMode
// returns a deterministic layoutMode in both Jest and the Storybook UI.
// width=350 → narrow (< MIN_WIDTH_MASTER_DETAIL_LAYOUT=700)
// width=800 → wide  (≥ MIN_WIDTH_MASTER_DETAIL_LAYOUT=700)
const LayoutWrapper = ({ width, children }: { width: number; children: React.ReactNode }) => (
	<ResponsiveLayoutContext.Provider
		value={{
			fontScale: 1,
			fontScaleLimited: 1,
			isLargeFontScale: false,
			rowHeight: BASE_ROW_HEIGHT,
			rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED,
			width,
			height: 800
		}}>
		{children}
	</ResponsiveLayoutContext.Provider>
);

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

export const Default = () => (
	<LayoutWrapper width={350}>
		<Dialpad testID='dialpad' />
	</LayoutWrapper>
);

export const WithValue = () => {
	setStoreState({ dialpadValue: '123' });
	return (
		<LayoutWrapper width={350}>
			<Dialpad testID='dialpad' />
		</LayoutWrapper>
	);
};

const LandscapeWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.landscapeContainer}>{children}</View>
);

export const TabletLandscape = () => (
	<LayoutWrapper width={800}>
		<LandscapeWrapper>
			<Dialpad testID='dialpad' />
		</LandscapeWrapper>
	</LayoutWrapper>
);

export const TabletLandscapeWithValue = () => {
	setStoreState({ dialpadValue: '1234' });
	return (
		<LayoutWrapper width={800}>
			<LandscapeWrapper>
				<Dialpad testID='dialpad' />
			</LandscapeWrapper>
		</LayoutWrapper>
	);
};
