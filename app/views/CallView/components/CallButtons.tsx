import React from 'react';
import { View } from 'react-native';

import I18n from '../../../i18n';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import CallActionButton from './CallActionButton';
import { styles } from '../styles';
import { useTheme } from '../../../theme';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import Dialpad from './Dialpad/Dialpad';

export const CallButtons = () => {
	'use memo';

	const { colors } = useTheme();

	const callState = useCallStore(state => state.callState);
	const isMuted = useCallStore(state => state.isMuted);
	const isOnHold = useCallStore(state => state.isOnHold);
	const isSpeakerOn = useCallStore(state => state.isSpeakerOn);

	const toggleMute = useCallStore(state => state.toggleMute);
	const toggleHold = useCallStore(state => state.toggleHold);
	const toggleSpeaker = useCallStore(state => state.toggleSpeaker);
	const endCall = useCallStore(state => state.endCall);

	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';

	const handleMessage = () => {
		// TODO: Navigate to chat with caller
		// Navigation.navigate('RoomView', { rid, t: 'd' });
		alert('Message');
	};

	const handleDialpad = () => {
		showActionSheetRef({ children: <Dialpad /> });
	};

	const handleEndCall = () => {
		endCall();
	};

	return (
		<View style={[styles.buttonsContainer, { borderTopColor: colors.strokeExtraLight }]}>
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

			<View style={styles.buttonsRow}>
				<CallActionButton icon='message' label={I18n.t('Message')} onPress={handleMessage} testID='call-view-message' />
				<CallActionButton
					icon='phone-end'
					label={isConnecting ? I18n.t('Cancel') : I18n.t('End')}
					onPress={handleEndCall}
					variant='danger'
					testID='call-view-end'
				/>
				<CallActionButton icon='dialpad' label={I18n.t('Dialpad')} onPress={handleDialpad} testID='call-view-dialpad' />
			</View>
		</View>
	);
};
