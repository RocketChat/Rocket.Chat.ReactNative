import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Animated, Text } from 'react-native';
import { Audio } from 'expo-av';
import {
	PanGestureHandler, State, LongPressGestureHandler, TouchableNativeFeedback
} from 'react-native-gesture-handler';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import RNFetchBlob from 'rn-fetch-blob';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { SendButton } from './buttons';

const mode = {
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: false,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
};

const recordingSettings = {
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

const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

const startRecordingAudio = async(instance, audioMode, settings, setRecordingStatus) => {
	try {
		const permission = await Audio.requestPermissionsAsync();

		if (permission.status === 'granted') {
			await Audio.setAudioModeAsync(audioMode);
			await instance.prepareToRecordAsync(settings);

			instance.setOnRecordingStatusUpdate((status) => {
				setRecordingStatus(status);
			});

			await instance.startAsync();
		} else {
			console.log('Permissions not granted');
		}
	} catch (error) {
		console.log(error);
	}

	activateKeepAwake();
};

const finishRecordingAudio = async(instance, setRecordingPersisted, onFinish) => {
	const uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	try {
		const fileURI = instance.getURI();
		const fileData = await RNFetchBlob.fs.stat(uriToPath(fileURI));

		await instance.stopAndUnloadAsync();

		const fileInfo = {
			name: `${ Date.now() }.aac`,
			mime: 'audio/aac',
			type: 'audio/aac',
			store: 'Uploads',
			path: fileURI,
			size: fileData.size
		};

		setRecordingPersisted(false);
		deactivateKeepAwake();
		return onFinish && onFinish(fileInfo);
	} catch (err) {
		setRecordingPersisted(false);
		deactivateKeepAwake();
		return onFinish && onFinish(false);
	}
};

const cancelAudioMessage = async(instance, onFinish, setRecordingCancelled, setRecordingPersisted) => {
	await instance.stopAndUnloadAsync();
	setRecordingCancelled(true);
	setRecordingPersisted(false);
	deactivateKeepAwake();
	return onFinish && onFinish(false);
};

const RecordAudio = (({ theme, recordingCallback, onFinish }) => {
	const touchX = useRef(new Animated.Value(0)).current;
	const touchY = useRef(new Animated.Value(0)).current;
	const recordingInstance = useRef();
	const panRef = useRef(null);
	const longPressRef = useRef(null);

	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});
	const [recordingCancelled, setRecordingCancelled] = useState(false);
	const [recordingPersisted, setRecordingPersisted] = useState(false);

	useEffect(() => {
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);


	const onPanEvent = Animated.event(
		[{ nativeEvent: { x: touchX, y: touchY } }],
		{
			useNativeDriver: true,
			listener: (e) => {
				const { nativeEvent } = e;
				if (nativeEvent.x <= -120 && recordingInstance.current && recordingStatus.isRecording && !recordingCancelled) {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
				}

				if (nativeEvent.y <= -80 && recordingInstance.current && recordingStatus.isRecording && !recordingCancelled) {
					setRecordingPersisted(true);
				}
			}
		}
	);

	const onPanStateChange = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				console.log('pan active');

				break;
			}
			case State.END: {
				console.log('pan end');

				break;
			}
			case State.CANCELLED: {
				console.log('pan cancelled');
				break;
			}
			case State.BEGAN: {
				console.log('pan began');
				break;
			}
			case State.FAILED: {
				console.log('pan failed');
				break;
			}
			default:
				break;
		}
	};

	const onLongPressStateChange = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				console.log('longpress active');

				if (!recordingStatus.isRecording) {
					recordingInstance.current = new Audio.Recording();
					startRecordingAudio(recordingInstance.current, mode, recordingSettings, setRecordingStatus);
					setRecordingCancelled(false);
					setRecordingPersisted(false);
				} else if (recordingStatus.isRecording && recordingInstance.current) {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
				}

				break;
			}
			case State.END: {
				console.log('longpress end');

				if (recordingStatus.durationMillis > 300 && recordingStatus.isRecording && !recordingPersisted) {
					finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish);
				}
				if (recordingStatus.durationMillis < 300 && !recordingPersisted) {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
				}
				break;
			}
			case State.CANCELLED: {
				console.log('longpress cancelled');
				break;
			}
			case State.BEGAN: {
				console.log('longpress began');
				break;
			}
			case State.FAILED: {
				console.log('longpress failed');
				break;
			}
			default:
				break;
		}
	};

	const cancelButton = recordingPersisted ? (
		<TouchableNativeFeedback
			style={{ maxHeight: styles.textBoxInput.fontSize }}
			onPress={() => {
				cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
			}}
		>
			<Text style={[styles.cancelRecordingText, { color: themes[theme].titleText }]}>
				Cancel
			</Text>
		</TouchableNativeFeedback>
	) : null;

	const currentTimeText = recordingStatus.isRecording ? (
		<>
			<Text
				key='currentTime'
				style={[styles.textBoxInput, { color: themes[theme].titleText }]}
			>
				{_formatTime(Math.floor(recordingStatus.durationMillis / 1000))}
			</Text>
			{cancelButton }
		</>
	) : null;


	let recordingButton = null;
	if (recordingPersisted) {
		recordingButton = (
			<SendButton
				theme={theme}
				onPress={() => {
					finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish);
				}}
			/>
		);
	} else {
		recordingButton = (
			<LongPressGestureHandler
				ref={longPressRef}
				simultaneousHandlers={[panRef]}
				minDurationMs={2}
				maxDist={300}
				onHandlerStateChange={onLongPressStateChange}
			>
				<Animated.View
					style={styles.actionButton}
					testID='messagebox-send-audio'
					accessibilityLabel={I18n.t('Send_audio_message')}
					accessibilityTraits='button'
				>
					<CustomIcon name='mic' size={23} color={themes[theme].tintColor} />
				</Animated.View>
			</LongPressGestureHandler>
		);
	}


	return (
		<>
			{currentTimeText}

			<PanGestureHandler
				ref={panRef}
				simultaneousHandlers={[longPressRef]}
				onGestureEvent={onPanEvent}
				onHandlerStateChange={onPanStateChange}
			>
				<Animated.View>
					{recordingButton}
				</Animated.View>
			</PanGestureHandler>
		</>
	);
});

RecordAudio.propTypes = {
	theme: PropTypes.string,
	recordingCallback: PropTypes.func,
	onFinish: PropTypes.func
};

export default RecordAudio;
