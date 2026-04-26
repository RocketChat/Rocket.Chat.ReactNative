import React, { useEffect } from 'react';
import { Audio, InterruptionModeIOS } from 'expo-av';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import SafeAreaView from '../../containers/SafeAreaView';
import Ringer, { ERingerSounds } from '../../containers/Ringer';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const callState = useCallStore(state => state.callState);
	const direction = useCallStore(state => state.direction);

	useEffect(() => {
		const configureAudio = async () => {
			try {
				await Audio.setAudioModeAsync({
					playsInSilentModeIOS: true,
					allowsRecordingIOS: true,
					interruptionModeIOS: InterruptionModeIOS.DoNotMix,
					staysActiveInBackground: false,
					shouldDuckAndroid: false
				});
			} catch (error) {
				console.error('[VoIP] Failed to configure audio mode for CallView:', error);
			}
		};
		configureAudio();

		return () => {
			Audio.setAudioModeAsync({
				playsInSilentModeIOS: false,
				allowsRecordingIOS: false,
				interruptionModeIOS: InterruptionModeIOS.DoNotMix,
				staysActiveInBackground: false,
				shouldDuckAndroid: false
			}).catch(() => {
				// Ignore errors on teardown
			});
		};
	}, []);

	if (!call) {
		return null;
	}

	const showRingback = callState === 'ringing' && direction === 'outgoing';

	return (
		<SafeAreaView testID='call-view-container' style={[styles.contentContainer, { backgroundColor: colors.surfaceLight }]}>
			{showRingback ? <Ringer ringer={ERingerSounds.DIALTONE} /> : null}
			<CallerInfo />
			<CallButtons />
		</SafeAreaView>
	);
};

export default CallView;
