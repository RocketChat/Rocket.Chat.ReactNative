import { type ReactElement, useEffect } from 'react';
import { setAudioModeAsync } from 'expo-audio';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import SafeAreaView from '../../containers/SafeAreaView';
import Ringer, { ERingerSounds } from '../../containers/Ringer';
import { isIOS } from '../../lib/methods/helpers';
import NativeVoipModule from '../../lib/native/NativeVoip';

const CallView = (): ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const callState = useCallStore(state => state.callState);
	const direction = useCallStore(state => state.direction);

	useEffect(() => {
		const configureAudio = async () => {
			try {
				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: true,
					interruptionMode: 'doNotMix',
					shouldPlayInBackground: false
				});
			} catch (error) {
				console.error('[VoIP] Failed to configure audio mode for CallView:', error);
			}
		};
		configureAudio();

		return () => {
			setAudioModeAsync({
				playsInSilentMode: false,
				allowsRecording: false,
				interruptionMode: 'doNotMix',
				shouldPlayInBackground: false
			}).catch(() => {
				// Ignore errors on teardown
			});
		};
	}, []);

	const showRingback = callState === 'ringing' && direction === 'outgoing';

	// Android plays ringback natively (USAGE_VOICE_COMMUNICATION) so it follows the active comm
	// device and toggleSpeaker actually reroutes it. iOS keeps expo-av Ringer (CallKit-managed).
	useEffect(() => {
		if (isIOS || !showRingback) return;
		NativeVoipModule.startRingback().catch(error => {
			console.error('[VoIP] startRingback failed:', error);
		});
		return () => {
			NativeVoipModule.stopRingback().catch(error => {
				console.error('[VoIP] stopRingback failed:', error);
			});
		};
	}, [showRingback]);

	if (!call) {
		return null;
	}

	return (
		<SafeAreaView testID='call-view-container' style={[styles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
			{showRingback && isIOS ? <Ringer ringer={ERingerSounds.DIALTONE} /> : null}
			<CallerInfo />
			<CallButtons />
		</SafeAreaView>
	);
};

export default CallView;
