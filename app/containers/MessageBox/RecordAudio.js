import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import RNFetchBlob from 'rn-fetch-blob';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { mode as playbackMode } from '../message/Audio';

const RECORDING_MODE = {
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: false,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
};

const RECORDING_SETTINGS = {
	android: {
		extension: '.aac',
		outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
		audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
		sampleRate: 22050,
		numberOfChannels: 1,
		bitRate: 128000
	},
	ios: {
		extension: '.aac',
		audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MIN,
		sampleRate: 22050,
		bitRate: 128000,
		outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
		numberOfChannels: 2
	}
};

const startRecordingAudio = async(instance, setRecordingStatus) => {
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
		console.log('startrecordingerror', error);
	}
};

const finishRecordingAudio = async(instance, onFinish, setRecordingStatus) => {
	const uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	try {
		await instance.stopAndUnloadAsync();

		const fileURI = instance.getURI();
		const fileData = await RNFetchBlob.fs.stat(uriToPath(fileURI));

		await Audio.setAudioModeAsync(playbackMode);

		setRecordingStatus({
			canRecord: true,
			isRecording: false,
			durationMillis: 0,
			isDoneRecording: true
		});

		const fileInfo = {
			name: `${ Date.now() }.aac`,
			mime: 'audio/aac',
			type: 'audio/aac',
			store: 'Uploads',
			path: fileURI,
			size: fileData.size
		};

		deactivateKeepAwake();
		return onFinish && onFinish(fileInfo);
	} catch (err) {
		await Audio.setAudioModeAsync(playbackMode);
		deactivateKeepAwake();
		setRecordingStatus({
			canRecord: true,
			isRecording: false,
			durationMillis: 0,
			isDoneRecording: true
		});
		return onFinish && onFinish(false);
	}
};

const RecordAudio = ({ theme, recordingCallback, onFinish }) => {
	/* Refs */
	const recordingInstance = useRef(null);

	/* State */
	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});

	/* Effects */
	useEffect(() => {
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);

	/* UI */
	const recordingButton = (
		<TouchableOpacity
			onPressIn={() => {
				recordingInstance.current = new Audio.Recording();
				startRecordingAudio(recordingInstance.current, setRecordingStatus);
			}}
			onPressOut={() => {
				if (recordingStatus.isRecording) {
					finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus);
				}
			}}
			style={styles.actionButton}
			testID='messagebox-send-audio'
			accessibilityLabel={I18n.t('Send_audio_message')}
			accessibilityTraits='button'
		>
			<CustomIcon name='mic' size={23} color={recordingStatus.isRecording ? themes[theme].focusedBackground : themes[theme].tintColor} />
		</TouchableOpacity>
	);

	return (
		<>
			{recordingButton}
		</>
	);
};

RecordAudio.propTypes = {
	theme: PropTypes.string,
	recordingCallback: PropTypes.func,
	onFinish: PropTypes.func
};

export default RecordAudio;
