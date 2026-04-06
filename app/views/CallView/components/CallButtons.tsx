import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import I18n from '../../../i18n';
import { navigateToCallRoom } from '../../../lib/services/voip/navigateToCallRoom';
import { useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import CallActionButton from './CallActionButton';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import Dialpad from './Dialpad/Dialpad';
import { type LayoutMode } from '..';

export const CallButtons = ({ layoutMode }: { layoutMode: LayoutMode }) => {
	'use memo';

	const { colors } = useTheme();

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
		navigateToCallRoom().catch(() => undefined);
	};

	const handleDialpad = () => {
		showActionSheetRef({ children: <Dialpad /> });
	};

	const handleEndCall = () => {
		endCall();
	};

	const speakerButton = (
		<CallActionButton
			icon={isSpeakerOn ? 'audio' : 'audio-disabled'}
			label={I18n.t('Speaker')}
			onPress={toggleSpeaker}
			variant={isSpeakerOn ? 'active' : 'default'}
			disabled={isConnecting}
			testID='call-view-speaker'
		/>
	);

	const holdButton = (
		<CallActionButton
			icon={'pause-shape-unfilled'}
			label={isOnHold ? I18n.t('Unhold') : I18n.t('Hold')}
			onPress={toggleHold}
			variant={isOnHold ? 'active' : 'default'}
			disabled={isConnecting}
			testID='call-view-hold'
		/>
	);

	const muteButton = (
		<CallActionButton
			icon={isMuted ? 'microphone-disabled' : 'microphone'}
			label={isMuted ? I18n.t('Unmute') : I18n.t('Mute')}
			onPress={toggleMute}
			variant={isMuted ? 'active' : 'default'}
			disabled={isConnecting}
			testID='call-view-mute'
		/>
	);

	const messageButton = (
		<CallActionButton
			icon='message'
			label={I18n.t('Message')}
			onPress={handleMessage}
			disabled={messageDisabled}
			testID='call-view-message'
		/>
	);

	const endButton = (
		<CallActionButton
			icon='phone-off'
			label={isConnecting ? I18n.t('Cancel') : I18n.t('End')}
			onPress={handleEndCall}
			variant='danger'
			testID='call-view-end'
		/>
	);

	const dialpadButton = (
		<CallActionButton
			icon='dialpad'
			label={I18n.t('Dialpad')}
			onPress={handleDialpad}
			disabled={isConnecting}
			testID='call-view-dialpad'
		/>
	);

	return (
		<Animated.View
			style={[styles.buttonsContainer, { borderTopColor: colors.strokeExtraLight }, containerStyle]}
			pointerEvents={controlsVisible ? 'auto' : 'none'}
			testID='call-buttons'>
			{layoutMode === 'wide' ? (
				<View style={styles.buttonsRowLast} testID='call-buttons-row-0'>
					{speakerButton}
					{holdButton}
					{muteButton}
					{messageButton}
					{endButton}
					{dialpadButton}
				</View>
			) : (
				<>
					<View style={styles.buttonsRow} testID='call-buttons-row-0'>
						{speakerButton}
						{holdButton}
						{muteButton}
					</View>
					<View style={styles.buttonsRowLast} testID='call-buttons-row-1'>
						{messageButton}
						{endButton}
						{dialpadButton}
					</View>
				</>
			)}
		</Animated.View>
	);
};
