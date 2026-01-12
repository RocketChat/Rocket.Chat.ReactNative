import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import RNCallKeep from 'react-native-callkeep';
import Touchable from 'react-native-platform-touchable';
import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import I18n from '../../i18n';
import { CustomIcon } from '../../containers/CustomIcon';
import { mediaSessionStore } from '../../lib/services/voip/MediaSessionStore';
import { type InsideStackParamList } from '../../stacks/types';
import CallerInfo from './components/CallerInfo';
import CallActionButton from './components/CallActionButton';
import CallStatusText from './components/CallStatusText';
import CallTimer from './components/CallTimer';
import { styles } from './styles';

const CallView = (): React.ReactElement | null => {
	const {
		params: { callUUID }
	} = useRoute<RouteProp<InsideStackParamList, 'CallView'>>();
	const { goBack } = useNavigation();

	const [call, setCall] = useState<IClientMediaCall | null>(null);
	const [callState, setCallState] = useState<string>('connecting');
	const [isMuted, setIsMuted] = useState(false);
	const [isOnHold, setIsOnHold] = useState(false);
	const [isSpeakerOn, setIsSpeakerOn] = useState(false);
	const [callStartTime, setCallStartTime] = useState<number | null>(null);

	// Get call from mediaSessionStore
	useEffect(() => {
		const session = mediaSessionStore.getCurrentInstance();
		const mainCall = session?.getMainCall();

		if (mainCall) {
			setCall(mainCall);
			setCallState(mainCall.state);
			setIsMuted(mainCall.muted);
			setIsOnHold(mainCall.held);

			// Set call start time when call is active
			if (mainCall.state === 'active') {
				setCallStartTime(Date.now());
			}
		}

		return () => {
			// Cleanup
		};
	}, []);

	// Subscribe to call state changes
	useEffect(() => {
		if (!call) {
			return;
		}

		const handleStateChange = () => {
			setCallState(call.state);

			// Set start time when call becomes active
			if (call.state === 'active' && !callStartTime) {
				setCallStartTime(Date.now());
			}
		};

		const handleTrackStateChange = () => {
			setIsMuted(call.muted);
			setIsOnHold(call.held);
		};

		const handleEnded = () => {
			goBack();
		};

		call.emitter.on('stateChange', handleStateChange);
		call.emitter.on('trackStateChange', handleTrackStateChange);
		call.emitter.on('ended', handleEnded);

		return () => {
			call.emitter.off('stateChange', handleStateChange);
			call.emitter.off('trackStateChange', handleTrackStateChange);
			call.emitter.off('ended', handleEnded);
		};
	}, [call, callStartTime, goBack]);

	// Keep screen awake during call
	useEffect(() => {
		activateKeepAwake();
		return () => {
			deactivateKeepAwake();
		};
	}, []);

	const handleToggleSpeaker = useCallback(() => {
		// TODO: Implement speaker toggle via RNCallKeep or WebRTC audio routing
		setIsSpeakerOn(prev => !prev);
	}, []);

	const handleToggleHold = useCallback(() => {
		if (!call) {
			return;
		}
		call.setHeld(!isOnHold);
	}, [call, isOnHold]);

	const handleToggleMute = useCallback(() => {
		if (!call) {
			return;
		}
		call.setMuted(!isMuted);
	}, [call, isMuted]);

	const handleMessage = useCallback(() => {
		// TODO: Navigate to chat with caller
		// Navigation.navigate('RoomView', { rid, t: 'd' });
	}, []);

	const handleEndCall = useCallback(() => {
		if (!call) {
			RNCallKeep.endCall(callUUID);
			goBack();
			return;
		}

		if (callState === 'ringing') {
			call.reject();
		} else {
			call.hangup();
		}
		RNCallKeep.endCall(callUUID);
	}, [call, callState, callUUID, goBack]);

	const handleMore = useCallback(() => {
		// TODO: Show action sheet with more options (DTMF, transfer, etc.)
	}, []);

	const handleMinimize = useCallback(() => {
		goBack();
	}, [goBack]);

	if (!call) {
		return null;
	}

	const callerName = call.contact.displayName || call.contact.username || I18n.t('Unknown');
	const callerExtension = call.contact.sipExtension;
	const isConnecting = callState === 'connecting' || callState === 'ringing';
	const isConnected = callState === 'active';

	const getHeaderTitle = () => {
		if (isConnecting) {
			return I18n.t('Connecting');
		}
		if (isConnected && callStartTime) {
			return `${callerName} – ${CallTimer({ startTime: callStartTime })}`;
		}
		return callerName;
	};

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<View style={styles.contentContainer}>
				{/* Header */}
				<View style={styles.header}>
					<Touchable onPress={handleMinimize} style={styles.headerButton} accessibilityLabel={I18n.t('Minimize')}>
						<CustomIcon name='arrow-down' size={24} color='#FFFFFF' />
					</Touchable>
					<Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
					<Touchable onPress={handleEndCall} style={styles.headerButton} accessibilityLabel={I18n.t('End')}>
						<CustomIcon name='phone-end' size={24} color='#F5455C' />
					</Touchable>
				</View>

				{/* Caller Info */}
				<CallerInfo
					name={callerName}
					extension={callerExtension}
					avatarText={call.contact.username}
					isMuted={isMuted && isConnected}
					showOnlineStatus={isConnected}
				/>

				{/* Status Text */}
				{isConnected && <CallStatusText isOnHold={isOnHold} isMuted={isMuted} />}

				{/* Action Buttons */}
				<View style={styles.buttonsContainer}>
					{/* First row of buttons */}
					<View style={styles.buttonsRow}>
						<CallActionButton
							icon={isSpeakerOn ? 'audio' : 'audio-disabled'}
							label={I18n.t('Speaker')}
							onPress={handleToggleSpeaker}
							variant={isSpeakerOn ? 'active' : 'default'}
							testID='call-view-speaker'
						/>
						<CallActionButton
							icon={isOnHold ? 'pause-filled' : 'pause'}
							label={isOnHold ? I18n.t('Unhold') : I18n.t('Hold')}
							onPress={handleToggleHold}
							variant={isOnHold ? 'active' : 'default'}
							disabled={isConnecting}
							testID='call-view-hold'
						/>
						<CallActionButton
							icon={isMuted ? 'microphone-disabled' : 'microphone'}
							label={isMuted ? I18n.t('Unmute') : I18n.t('Mute')}
							onPress={handleToggleMute}
							variant={isMuted ? 'active' : 'default'}
							disabled={isConnecting}
							testID='call-view-mute'
						/>
					</View>

					{/* Second row of buttons */}
					<View style={styles.buttonsRow}>
						<CallActionButton
							icon='message'
							label={I18n.t('Message')}
							onPress={handleMessage}
							testID='call-view-message'
						/>
						<CallActionButton
							icon='phone-end'
							label={isConnecting ? I18n.t('Cancel') : I18n.t('End')}
							onPress={handleEndCall}
							variant='danger'
							testID='call-view-end'
						/>
						<CallActionButton icon='kebab' label={I18n.t('More')} onPress={handleMore} testID='call-view-more' />
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
};

export default CallView;
