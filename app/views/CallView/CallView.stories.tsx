import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import CallView from '.';
import CallerInfo from './components/CallerInfo';
import { CallButtons } from './components/CallButtons';
import { styles as callViewStyles } from './styles';
import { useTheme } from '../../theme';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	ResponsiveLayoutContext
} from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: mockCallStartTime,
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
	setStoreState({ callState: 'active', callStartTime: mockCallStartTime - 61000 });
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

// Tablet / wide layout stories — force layoutMode='wide' via ResponsiveLayoutContext width
const TabletCallView = () => {
	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	if (!call) return null;
	return (
		<ResponsiveLayoutContext.Provider value={{ ...responsiveLayoutProviderLargeFontValue(1), width: 800 }}>
			<View style={[callViewStyles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
				<CallerInfo />
				<CallButtons />
			</View>
		</ResponsiveLayoutContext.Provider>
	);
};

export const TabletConnectedCall = () => {
	setStoreState({ callState: 'active', callStartTime: mockCallStartTime - 61000 });
	return <TabletCallView />;
};

export const TabletConnectingCall = () => {
	setStoreState({ callState: 'accepted', callStartTime: null });
	return <TabletCallView />;
};

export const TabletMutedCall = () => {
	setStoreState({ callState: 'active', isMuted: true });
	return <TabletCallView />;
};

export const TabletOnHoldCall = () => {
	setStoreState({ callState: 'active', isOnHold: true });
	return <TabletCallView />;
};

export const TabletMutedAndOnHold = () => {
	setStoreState({ callState: 'active', isMuted: true, isOnHold: true });
	return <TabletCallView />;
};

export const TabletSpeakerOn = () => {
	setStoreState({ callState: 'active', isSpeakerOn: true });
	return <TabletCallView />;
};
