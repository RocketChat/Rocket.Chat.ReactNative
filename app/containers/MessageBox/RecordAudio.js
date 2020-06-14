import React, { useRef, useState, useEffect } from 'react';
import {
	Animated, Text, View, Dimensions, Easing
} from 'react-native';
import PropTypes from 'prop-types';
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

const RECORDING_PERSIST_DISTANCE = -80;	// Swipe up gesture to persist recording
const RECORDING_CANCEL_DISTANCE = -120;	// Swipe left gesture to cancel recording
const RECORDING_MINIMUM_DURATION = 300;	// Cancel if recording < this duration (in ms)

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
	/* Refs */
	const recordingInstance = useRef();
	const panRef = useRef(null);
	const longPressRef = useRef(null);
	const touchX = useRef(new Animated.Value(0)).current;
	const touchY = useRef(new Animated.Value(0)).current;

	/* State */
	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});
	const [recordingCancelled, setRecordingCancelled] = useState(false);
	const [recordingPersisted, setRecordingPersisted] = useState(false);
	const [showRecordTooltip, setShowRecordTooltip] = useState(false);

	/* Effects */
	useEffect(() => {
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);

	/* Animations */
	// Button Press
	const buttonPressAnim = useRef(new Animated.Value(0)).current;
	const buttonGrow = buttonPressAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 80]
	});

	const animateButton = (from, to) => {
		buttonPressAnim.setValue(from);
		Animated.timing(
			buttonPressAnim,
			{
				toValue: to,
				duration: 150,
				easing: Easing.ease,
				useNativeDriver: false
			}
		).start();
	};

	// Persist
	const persistAnim = touchY.interpolate({
		inputRange: [RECORDING_PERSIST_DISTANCE, 0],
		outputRange: [1, 0],
		extrapolate: 'clamp'
	});
	const persistTranslateY = persistAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, RECORDING_PERSIST_DISTANCE]
	});


	// Cancel
	const cancelAnim = touchX.interpolate({
		inputRange: [RECORDING_CANCEL_DISTANCE, 0],
		outputRange: [1, 0],
		extrapolate: 'clamp'
	});
	const cancelTranslateX = cancelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, RECORDING_CANCEL_DISTANCE]
	});


	/* Functions */
	const onPanEvent = Animated.event(
		[{ nativeEvent: { x: touchX, y: touchY } }],
		{
			useNativeDriver: false,
			listener: (e) => {
				const { nativeEvent } = e;
				if (recordingInstance.current && recordingStatus.isRecording && !recordingCancelled && !recordingPersisted) {
					// Swipe left gesture, cancel message
					if (nativeEvent.x <= RECORDING_CANCEL_DISTANCE) {
						animateButton(1, 0);
						cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
					}

					// Swipe up gesture, persist recording
					if (nativeEvent.y <= RECORDING_PERSIST_DISTANCE) {
						buttonPressAnim.setValue(0);
						setRecordingPersisted(true);
					}
				}
			}
		}
	);

	const onLongPressStateChange = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				touchY.setValue(0);
				touchX.setValue(0);
				if (!recordingStatus.isRecording) {
					// Start if not recording
					recordingInstance.current = new Audio.Recording();
					startRecordingAudio(recordingInstance.current, mode, recordingSettings, setRecordingStatus);
					setRecordingCancelled(false);
					setRecordingPersisted(false);
				} else if (recordingStatus.isRecording && recordingInstance.current) {
					// Cancel if already recording
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
				}
				animateButton(0, 1);
				break;
			}

			case State.END: {
				if (!recordingPersisted) {
					if (recordingStatus.durationMillis > RECORDING_MINIMUM_DURATION && recordingStatus.isRecording) {
						// Finish recording as duration > RECORDING_MINIMUM_DURATION
						finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish);
						animateButton(1, 0);
					}
					if (recordingStatus.durationMillis <= RECORDING_MINIMUM_DURATION && !recordingCancelled) {
						// Recording duration less than RECORDING_MINIMUM_DURATION. Show tooltip and cancel message
						setShowRecordTooltip(true);
						setTimeout(() => {
							setShowRecordTooltip(false);
						}, 1500);
						cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
						animateButton(0.7, 0);
					}
				}
				break;
			}
			default:
				break;
		}
	};

	/* UI */
	const currentTimeText = recordingStatus.isRecording ? (
		<Text
			key='currentTime'
			style={[styles.cancelRecordingText, { color: themes[theme].titleText }]}
		>
			{_formatTime(Math.floor(recordingStatus.durationMillis / 1000))}
		</Text>
	) : null;


	let recordingButton = null;
	let centerContent = null;
	if (recordingPersisted) {
		recordingButton = (
			<SendButton
				theme={theme}
				onPress={() => {
					finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish);
				}}
			/>
		);

		centerContent = (
			<TouchableNativeFeedback
				onPress={() => {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted);
				}}
			>
				<Text style={[styles.cancelRecordingText, { color: themes[theme].titleText, textAlign: 'right' }]}>
					Cancel
				</Text>
			</TouchableNativeFeedback>
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
					<Animated.View
						style={{
							backgroundColor: 'red',
							position: 'absolute',
							width: buttonGrow,
							height: buttonGrow,
							zIndex: -1,
							borderRadius: 200,
							transform: [{ translateY: persistTranslateY }]
						}}
					/>

				</Animated.View>
			</LongPressGestureHandler>
		);

		if (recordingStatus.isRecording) {
			centerContent = (
				<Animated.View style={{ transform: [{ translateX: cancelTranslateX }] }}>

					<Text style={[styles.cancelRecordingText, {
						color: themes[theme].titleText,
						backgroundColor: 'blue',
						textAlign: 'right'
					}]}
					>
						{'<'} Slide to cancel
					</Text>
				</Animated.View>
			);
		}
	}

	const recordTooltip = showRecordTooltip ? (
		<View style={{
			backgroundColor: 'red',
			position: 'absolute',
			bottom: '130%',
			right: 1,
			width: Dimensions.get('window').width,
			zIndex: 100
		}}
		>
			<Text style={{ color: 'white', textAlign: 'right' }}>Hold to record. Release to send.</Text>
		</View>
	) : null;

	const recordingLeft = recordingStatus.isRecording ? (
		<View style={[styles.textBoxInput, {
			flexDirection: 'row', flex: 3, marginHorizontal: 24
		}]}
		>
			<View style={{ flex: 1 }}>
				{currentTimeText}
			</View>
			<View style={{ flex: 2 }}>
				{centerContent}
			</View>
		</View>
	) : null;


	return (
		<>
			{recordingLeft}

			<PanGestureHandler
				ref={panRef}
				simultaneousHandlers={[longPressRef]}
				onGestureEvent={onPanEvent}
			>
				<Animated.View>
					{recordingButton}
					{recordTooltip}
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
