import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import I18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { navigateToCallRoom } from '../../../lib/services/voip/navigateToCallRoom';
import { useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import CallActionButton from './CallActionButton';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import Dialpad from './Dialpad/Dialpad';
import { useCallLayoutMode } from '../useCallLayoutMode';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { type TIconsName } from '../../../containers/CustomIcon';

interface ICallButtonConfig {
	testID: string;
	icon: TIconsName;
	label: string;
	onPress: () => void;
	variant?: 'default' | 'active' | 'danger';
	disabled: boolean;
}

export const CallButtons = () => {
	'use memo';

	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { layoutMode } = useCallLayoutMode();
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;
	const singleRow = layoutMode === 'wide' || isLandscape;

	const callState = useCallStore(state => state.callState);
	const isMuted = useCallStore(state => state.isMuted);
	const isOnHold = useCallStore(state => state.isOnHold);
	const isSpeakerOn = useCallStore(state => state.isSpeakerOn);
	const roomId = useCallStore(state => state.roomId);
	const contact = useCallStore(state => state.contact);

	const toggleMute = useCallStore(state => state.toggleMute);
	const toggleHold = useCallStore(state => state.toggleHold);
	const toggleSpeaker = useCallStore(state => state.toggleSpeaker);
	const endCall = useCallStore(state => state.endCall);

	const controlsVisible = useControlsVisible();

	const containerStyle = useAnimatedStyle(() => ({
		opacity: withTiming(controlsVisible ? 1 : 0, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [{ translateY: withTiming(controlsVisible ? 0 : 100, { duration: CONTROLS_ANIMATION_DURATION }) }]
	}));

	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';
	const messageDisabled = Boolean(contact.sipExtension) || roomId == null;

	const handleMessage = () => {
		navigateToCallRoom({ isMasterDetail }).catch(() => undefined);
	};

	const handleDialpad = () => {
		showActionSheetRef({ children: <Dialpad /> });
	};

	const handleEndCall = () => {
		endCall();
	};

	const buttons: ICallButtonConfig[] = [
		{
			testID: 'call-view-speaker',
			icon: isSpeakerOn ? 'volume' : 'volume-off',
			label: I18n.t('Speaker'),
			onPress: toggleSpeaker,
			variant: isSpeakerOn ? 'active' : 'default',
			disabled: isConnecting
		},
		{
			testID: 'call-view-hold',
			icon: 'pause-shape-unfilled',
			label: isOnHold ? I18n.t('Unhold') : I18n.t('Hold'),
			onPress: toggleHold,
			variant: isOnHold ? 'active' : 'default',
			disabled: isConnecting
		},
		{
			testID: 'call-view-mute',
			icon: isMuted ? 'mic-off' : 'mic',
			label: isMuted ? I18n.t('Unmute') : I18n.t('Mute'),
			onPress: toggleMute,
			variant: isMuted ? 'active' : 'default',
			disabled: isConnecting
		},
		{
			testID: 'call-view-message',
			icon: 'message',
			label: I18n.t('Message'),
			onPress: handleMessage,
			disabled: messageDisabled
		},
		{
			testID: 'call-view-end',
			icon: 'phone-off',
			label: isConnecting ? I18n.t('Cancel') : I18n.t('End'),
			onPress: handleEndCall,
			variant: 'danger',
			disabled: false
		},
		{
			testID: 'call-view-dialpad',
			icon: 'dialpad',
			label: I18n.t('Dialpad'),
			onPress: handleDialpad,
			disabled: isConnecting
		}
	];

	return (
		<Animated.View
			style={[
				styles.buttonsContainer,
				{ borderTopColor: colors.strokeExtraLight, backgroundColor: colors.surfaceLight },
				containerStyle
			]}
			pointerEvents={controlsVisible ? 'auto' : 'none'}
			accessibilityElementsHidden={!controlsVisible}
			importantForAccessibility={controlsVisible ? 'auto' : 'no-hide-descendants'}
			testID='call-buttons'>
			{singleRow ? (
				<View style={styles.buttonsRow} testID='call-buttons-row-0'>
					{buttons.map(btn => (
						<CallActionButton
							key={btn.testID}
							icon={btn.icon}
							label={btn.label}
							onPress={btn.onPress}
							variant={btn.variant}
							disabled={btn.disabled}
							testID={btn.testID}
						/>
					))}
				</View>
			) : (
				<>
					<View style={styles.buttonsRow} testID='call-buttons-row-0'>
						{buttons.slice(0, 3).map(btn => (
							<CallActionButton
								key={btn.testID}
								icon={btn.icon}
								label={btn.label}
								onPress={btn.onPress}
								variant={btn.variant}
								disabled={btn.disabled}
								testID={btn.testID}
							/>
						))}
					</View>
					<View style={styles.buttonsRow} testID='call-buttons-row-1'>
						{buttons.slice(3, 6).map(btn => (
							<CallActionButton
								key={btn.testID}
								icon={btn.icon}
								label={btn.label}
								onPress={btn.onPress}
								variant={btn.variant}
								disabled={btn.disabled}
								testID={btn.testID}
							/>
						))}
					</View>
				</>
			)}
		</Animated.View>
	);
};
