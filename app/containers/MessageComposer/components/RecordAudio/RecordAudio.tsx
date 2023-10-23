import { View, Text } from 'react-native';
import React, { ReactElement, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

import { useTheme } from '../../../../theme';
import { BaseButton } from '../Buttons';
import { CustomIcon } from '../../../CustomIcon';
import sharedStyles from '../../../../views/Styles';
import { ReviewButton } from './ReviewButton';
import { useMessageComposerApi } from '../../context';

export const RecordAudio = (): ReactElement => {
	const { colors } = useTheme();
	const recordingRef = useRef<Audio.Recording>();
	const [status, setStatus] = React.useState<'recording' | 'reviewing'>('recording');
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
		try {
			await recordingRef.current?.stopAndUnloadAsync();
			// await recordingRef.current?.pauseAsync();
			// Do something with the URI, like upload it to firebase
		} catch (error) {
			// Do something with the error or handle it
			console.error(error);
		} finally {
			setRecordingAudio(false);
		}
	};

	const goReview = async () => {
		try {
			await recordingRef.current?.stopAndUnloadAsync();
			setStatus('reviewing');
			// const uri = recordingRef.current?.getURI();

			// // TODO: temp only. Remove after new player is implemented
			// const sound = new Audio.Sound();
			// await sound.loadAsync({ uri: uri! });
			// await sound.playAsync();
			// Don't forget to unload the sound from memory
			// when you are done using the Sound object
			// await sound.unloadAsync();
		} catch (error) {
			// An error occurred!
			console.error(error);
		}
	};

	const sendAudio = () => {
		alert('send audio');
	};

	if (status === 'reviewing') {
		return (
			<View
				style={{
					borderTopWidth: 1,
					paddingHorizontal: 16,
					backgroundColor: colors.surfaceLight,
					borderTopColor: colors.strokeLight
				}}
			>
				<Text style={{ marginLeft: 12, fontSize: 16, ...sharedStyles.textRegular, color: colors.fontDefault }}>REVIEW</Text>
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
					<BaseButton
						onPress={() => sendAudio()}
						testID='message-composer-send'
						accessibilityLabel='Send_message'
						icon='send-filled'
						color={colors.buttonBackgroundPrimaryDefault}
					/>
				</View>
			</View>
		);
	}

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
				<ReviewButton onPress={goReview} />
			</View>
		</View>
	);
};
