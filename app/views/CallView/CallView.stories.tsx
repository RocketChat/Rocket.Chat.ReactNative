import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import CallView from '.';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import { CALL_BACKGROUND_COLOR } from './styles';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	ResponsiveLayoutContext
} from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: CALL_BACKGROUND_COLOR
	}
});

// Mock navigation
// jest.mock('@react-navigation/native', () => ({
// 	...jest.requireActual('@react-navigation/native'),
// 	useNavigation: () => ({
// 		goBack: () => {}
// 	}),
// 	useRoute: () => ({
// 		params: { callUUID: 'test-uuid' }
// 	})
// }));

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
		callStartTime: Date.now(),
		contact: {
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: '2244'
		},
		...overrides
	});
};

const responsiveLayoutProviderLargeFontValue = (fontScale: number) => ({
	fontScale,
	fontScaleLimited: fontScale,
	isLargeFontScale: fontScale > 1,
	rowHeight: BASE_ROW_HEIGHT * fontScale,
	rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED * fontScale,
	width: 350,
	height: 800
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'CallView',
	component: CallView,
	decorators: [
		(Story: React.ComponentType) => (
			<ResponsiveLayoutContext.Provider value={responsiveLayoutProviderLargeFontValue(1)}>
				<NavigationContainer>
					<Wrapper>
						<Story />
					</Wrapper>
				</NavigationContainer>
			</ResponsiveLayoutContext.Provider>
		)
	]
};

export const ConnectedCall = () => {
	setStoreState({ callState: 'active', callStartTime: Date.now() - 61000 });
	return <CallView />;
};

export const ConnectingCall = () => {
	setStoreState({ callState: 'accepted', callStartTime: null });
	return <CallView />;
};

export const MutedCall = () => {
	setStoreState({ callState: 'active', isMuted: true });
	return <CallView />;
};

export const OnHoldCall = () => {
	setStoreState({ callState: 'active', isOnHold: true });
	return <CallView />;
};

export const MutedAndOnHold = () => {
	setStoreState({ callState: 'active', isMuted: true, isOnHold: true });
	return <CallView />;
};

export const SpeakerOn = () => {
	setStoreState({ callState: 'active', isSpeakerOn: true });
	return <CallView />;
};
