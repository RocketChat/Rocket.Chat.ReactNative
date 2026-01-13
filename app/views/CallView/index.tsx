import React, { useEffect } from 'react';
import { Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import I18n from '../../i18n';
import { CustomIcon } from '../../containers/CustomIcon';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import CallActionButton from './components/CallActionButton';
import CallStatusText from './components/CallStatusText';
// import { useCallTimer } from './components/CallTimer';
import { styles } from './styles';
import { useTheme } from '../../theme';

const CallView = (): React.ReactElement | null => {
	const { goBack } = useNavigation();
	const { colors } = useTheme();

	// Get state from store
	const call = useCallStore(state => state.call);
	const callState = useCallStore(state => state.callState);
	const isMuted = useCallStore(state => state.isMuted);
	const isOnHold = useCallStore(state => state.isOnHold);
	const isSpeakerOn = useCallStore(state => state.isSpeakerOn);
	const callStartTime = useCallStore(state => state.callStartTime);
	const contact = useCallStore(state => state.contact);

	// Get actions from store
	const toggleMute = useCallStore(state => state.toggleMute);
	const toggleHold = useCallStore(state => state.toggleHold);
	const toggleSpeaker = useCallStore(state => state.toggleSpeaker);
	const endCall = useCallStore(state => state.endCall);

	// Get formatted call duration
	// const callDuration = useCallTimer(callStartTime);
	const callDuration = '00:00';

	// Keep screen awake during call
	useEffect(() => {
		activateKeepAwakeAsync();
		return () => {
			deactivateKeepAwake();
		};
	}, []);

	const handleMessage = () => {
		// TODO: Navigate to chat with caller
		// Navigation.navigate('RoomView', { rid, t: 'd' });
		alert('Message');
	};

	const handleMore = () => {
		// TODO: Show action sheet with more options (DTMF, transfer, etc.)
		alert('More');
	};

	const handleCollapse = () => {
		// goBack();
		alert('Collapse call');
	};

	const handleEndCall = () => {
		endCall();
		goBack();
	};

	if (!call) {
		return null;
	}

	const callerName = contact.displayName || contact.username || I18n.t('Unknown');
	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';
	const isConnected = callState === 'active';

	const getHeaderTitle = () => {
		if (isConnecting) {
			return I18n.t('Connecting');
		}
		if (isConnected && callStartTime) {
			return `${callerName} – ${callDuration}`;
		}
		return callerName;
	};

	return (
		<SafeAreaView style={styles.container} testID='call-view'>
			<View style={[styles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
				{/* Header */}
				<View style={[styles.header, { backgroundColor: colors.surfaceNeutral }]}>
					<Pressable onPress={handleCollapse} style={styles.headerButton} accessibilityLabel={I18n.t('Minimize')}>
						<CustomIcon name='arrow-down' size={24} color={colors.fontDefault} />
					</Pressable>
					<Text style={[styles.headerTitle, { color: colors.fontDefault }]} testID='call-view-header-title'>
						{getHeaderTitle()}
					</Text>
					<Pressable onPress={handleEndCall} style={styles.headerButton} accessibilityLabel={I18n.t('End')}>
						<CustomIcon name='phone-end' size={24} color={colors.fontDanger} />
					</Pressable>
				</View>

				{/* Caller Info */}
				<CallerInfo isMuted={isMuted && isConnected} />

				{/* Status Text */}
				{isConnected && <CallStatusText />}

				{/* Action Buttons */}
				<View style={styles.buttonsContainer}>
					{/* First row of buttons */}
					<View style={styles.buttonsRow}>
						<CallActionButton
							icon={isSpeakerOn ? 'audio' : 'audio-disabled'}
							label={I18n.t('Speaker')}
							onPress={toggleSpeaker}
							variant={isSpeakerOn ? 'active' : 'default'}
							testID='call-view-speaker'
						/>
						<CallActionButton
							icon={'pause-shape-unfilled'}
							label={isOnHold ? I18n.t('Unhold') : I18n.t('Hold')}
							onPress={toggleHold}
							variant={isOnHold ? 'active' : 'default'}
							disabled={isConnecting}
							testID='call-view-hold'
						/>
						<CallActionButton
							icon={isMuted ? 'microphone-disabled' : 'microphone'}
							label={isMuted ? I18n.t('Unmute') : I18n.t('Mute')}
							onPress={toggleMute}
							variant={isMuted ? 'active' : 'default'}
							disabled={isConnecting}
							testID='call-view-mute'
						/>
					</View>

					{/* Second row of buttons */}
					<View style={styles.buttonsRow}>
						<CallActionButton icon='message' label={I18n.t('Message')} onPress={handleMessage} testID='call-view-message' />
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
