import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import RNFetchBlob from 'rn-fetch-blob';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';

const RECORDING_EXTENSION = '.aac';
const RECORDING_SETTINGS = {
	android: {
		extension: RECORDING_EXTENSION,
		outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
		audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
		sampleRate: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.android.sampleRate,
		numberOfChannels: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.android.numberOfChannels,
		bitRate: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.android.bitRate
	},
	ios: {
		extension: RECORDING_EXTENSION,
		audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MIN,
		sampleRate: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.ios.sampleRate,
		numberOfChannels: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.ios.numberOfChannels,
		bitRate: Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY.ios.bitRate,
		outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC
	}
};
const RECORDING_MODE = {
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: false,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
};

const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

const startRecordingAudio = async(instance, setRecordingStatus, setRecorderBusy) => {
	setRecorderBusy(true);
	try {
		const permissions = await Audio.getPermissionsAsync();

		if (permissions.status === 'granted') {
			await Audio.setAudioModeAsync(RECORDING_MODE);
			instance.setOnRecordingStatusUpdate((status) => {
				setRecordingStatus(status);
			});

			await instance.prepareToRecordAsync(RECORDING_SETTINGS);
			await instance.startAsync();
			activateKeepAwake();
		} else {
			await Audio.requestPermissionsAsync();
		}
	} catch (error) {
		// Do nothing
	}
	setRecorderBusy(false);
};

const finishRecordingAudio = async(instance, onFinish, setRecorderBusy) => {
	setRecorderBusy(true);
	const uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	try {
		await instance.stopAndUnloadAsync();

		const fileURI = instance.getURI();
		const fileData = await RNFetchBlob.fs.stat(uriToPath(fileURI));

		const fileInfo = {
			name: `${ Date.now() }.aac`,
			mime: 'audio/aac',
			type: 'audio/aac',
			store: 'Uploads',
			path: fileURI,
			size: fileData.size
		};

		onFinish(fileInfo);
	} catch (error) {
		// Do nothing
	}
	deactivateKeepAwake();
	setRecorderBusy(false);
};

const cancelAudioMessage = async(instance, setRecorderBusy) => {
	setRecorderBusy(true);
	try {
		await instance.stopAndUnloadAsync();
	} catch (error) {
		// Do nothing
	}
	deactivateKeepAwake();
	setRecorderBusy(false);
};

const RecordAudio = ({ theme, recordingCallback, onFinish }) => {
	const recordingInstance = useRef(null);

	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});
	const [recorderBusy, setRecorderBusy] = useState(false);

	useEffect(() => () => {
		if (recordingInstance.current) {
			cancelAudioMessage(recordingInstance.current, setRecorderBusy);
		}
	}, []);

	useEffect(() => {
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);

	const recordingContent = recordingStatus.isRecording ? (
		<View style={[styles.recordingContent]}>
			<View style={styles.textArea}>
				<BorderlessButton
					onPress={() => {
						if (!recorderBusy) {
							cancelAudioMessage(recordingInstance.current, setRecorderBusy);
						}
					}}
					accessibilityLabel={I18n.t('Cancel_recording')}
					accessibilityTraits='button'
					style={styles.actionButton}
				>
					<CustomIcon
						size={22}
						color={themes[theme].dangerColor}
						name='Cross'
					/>
				</BorderlessButton>
				<Text
					key='currentTime'
					style={[styles.recordingCancelText, { color: themes[theme].titleText }]}
				>
					{_formatTime(Math.floor(recordingStatus.durationMillis / 1000))}
				</Text>
			</View>
			<View style={styles.recordingContentFinish}>
				<BorderlessButton
					onPress={() => {
						if (!recorderBusy) {
							finishRecordingAudio(recordingInstance.current, onFinish, setRecorderBusy);
						}
					}}
					accessibilityLabel={I18n.t('Finish_recording')}
					accessibilityTraits='button'
					style={styles.actionButton}
				>
					<CustomIcon
						size={22}
						color={themes[theme].successColor}
						name='check'
					/>
				</BorderlessButton>
			</View>
		</View>
	) : (
		<BorderlessButton
			onPress={() => {
				if (!recorderBusy) {
					recordingInstance.current = new Audio.Recording();
					startRecordingAudio(recordingInstance.current, setRecordingStatus, setRecorderBusy);
				}
			}}
			style={styles.actionButton}
			testID='messagebox-send-audio'
			accessibilityLabel={I18n.t('Send_audio_message')}
			accessibilityTraits='button'
		>
			<CustomIcon name='mic' size={23} color={recordingStatus.isRecording ? themes[theme].focusedBackground : themes[theme].tintColor} />
		</BorderlessButton>
	);

	return recordingContent;
};

RecordAudio.propTypes = {
	theme: PropTypes.string,
	recordingCallback: PropTypes.func,
	onFinish: PropTypes.func
};

export default RecordAudio;
