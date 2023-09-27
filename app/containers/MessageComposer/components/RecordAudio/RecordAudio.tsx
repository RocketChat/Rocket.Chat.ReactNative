import { View, Text } from 'react-native';
import React, { ReactElement, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

import { useTheme } from '../../../../theme';
import { BaseButton } from '../Buttons';
import { CustomIcon } from '../../../CustomIcon';
import sharedStyles from '../../../../views/Styles';
import { SendButton } from './SendButton';
import { useMessageComposerApi } from '../../context';

export const RecordAudio = (): ReactElement => {
	const { colors } = useTheme();
	const recordingRef = useRef<Audio.Recording>();
	console.log('🚀 ~ file: RecordAudio.tsx:14 ~ RecordAudio ~ recordingRef:', recordingRef.current);
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	console.log('🚀 ~ file: RecordAudio.tsx:16 ~ RecordAudio ~ permissionResponse:', permissionResponse);
	const { setRecordingAudio } = useMessageComposerApi();

	useEffect(() => {
		const record = async () => {
			try {
				await requestPermission();
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
					playsInSilentModeIOS: true
				});
				recordingRef.current = new Audio.Recording();
				await recordingRef.current.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
				await recordingRef.current.startAsync();
				// You are now recording!
			} catch (error) {
				// An error occurred!
				alert('error');
				console.error(error);
			}
		};
		record();

		return () => {
			recordingRef.current?.stopAndUnloadAsync();
		};
	}, []);

	const cancelRecording = async () => {
		// try {
		// 	await recordingRef.current?.stopAndUnloadAsync();
		// 	// Do something with the URI, like upload it to firebase
		// } catch (error) {
		// 	// Do something with the error or handle it
		// 	console.error(error);
		// } finally {
		// 	setRecordingAudio(false);
		// }
		await recordingRef.current?.pauseAsync();
		const uri = recordingRef.current?.getURI();
		console.log('🚀 ~ file: RecordAudio.tsx:57 ~ cancelRecording ~ uri:', uri);

		try {
			const sound = new Audio.Sound();
			console.log('🚀 ~ file: RecordAudio.tsx:61 ~ cancelRecording ~ sound:', sound);
			await sound.loadAsync({ uri: uri! });
			await sound.playAsync();
			// Your sound is playing!

			// Don't forget to unload the sound from memory
			// when you are done using the Sound object
			await sound.unloadAsync();
		} catch (error) {
			// An error occurred!
			console.error(error);
		}
	};

	const stopRecording = async () => {
		// try {
		// 	await recordingRef.current?.stopAndUnloadAsync();
		// 	const uri = recordingRef.current?.getURI();
		// 	console.log('🚀 ~ file: RecordAudio.tsx:46 ~ stopRecording ~ uri', uri);
		// 	// Do something with the URI, like upload it to firebase
		// } catch (error) {
		// 	// Do something with the error or handle it
		// 	console.error(error);
		// } finally {
		// 	setRecordingAudio(false);
		// }
		try {
			await recordingRef.current?.startAsync();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<View
			style={{
				borderTopWidth: 1,
				paddingHorizontal: 16,
				backgroundColor: colors.surfaceLight,
				borderTopColor: colors.strokeLight
			}}
		>
			<View style={{ flexDirection: 'row', paddingVertical: 24, justifyContent: 'center', alignItems: 'center' }}>
				<CustomIcon name='microphone' size={24} color={colors.fontDanger} />
				<Text style={{ marginLeft: 12, fontSize: 16, ...sharedStyles.textRegular, color: colors.fontDefault }}>00:01</Text>
			</View>
			<View style={{ flexDirection: 'row' }}>
				<BaseButton
					onPress={() => cancelRecording()}
					testID='message-composer-delete-audio'
					accessibilityLabel='tbd'
					icon='delete'
				/>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Text style={{ fontSize: 14, ...sharedStyles.textRegular, color: colors.fontSecondaryInfo }}>
						Recording audio message
					</Text>
				</View>
				<SendButton onPress={stopRecording} />
			</View>
		</View>
	);
};
