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
import { mode as playbackMode } from '../message/Audio';

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

const finishRecordingAudio = async(instance, setRecordingPersisted, onFinish, setRecordingStatus) => {
	const uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	try {
		const fileURI = instance.getURI();
		const fileData = await RNFetchBlob.fs.stat(uriToPath(fileURI));

		await instance.stopAndUnloadAsync();

		setRecordingStatus({
			canRecord: true,
			isRecording: false,
			durationMillis: 0,
			isDoneRecording: true
		});

		await Audio.setAudioModeAsync(playbackMode);

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

		setRecordingStatus({
			canRecord: true,
			isRecording: false,
			durationMillis: 0,
			isDoneRecording: true
		});

		await Audio.setAudioModeAsync(playbackMode);
		return onFinish && onFinish(false);
	}
};

const cancelAudioMessage = async(instance, onFinish, setRecordingCancelled, setRecordingPersisted, setRecordingStatus) => {
	if (instance) {
		try {
			await instance.stopAndUnloadAsync();
			setRecordingStatus({
				canRecord: true,
				isRecording: false,
				durationMillis: 0,
				isDoneRecording: true
			});
			setRecordingCancelled(true);
			setRecordingPersisted(false);
			deactivateKeepAwake();
			await Audio.setAudioModeAsync(playbackMode);
			return onFinish && onFinish(false);
		} catch (error) {
			await Audio.setAudioModeAsync(playbackMode);
			console.log(error);
		}
	}
};

const RecordAudio = (({ theme, recordingCallback, onFinish }) => {
	/* Refs */
	const recordingInstance = useRef();
	const panRef = useRef(null);
	const swipeUpRef = useRef(null);
	const swipeLeftRef = useRef(null);
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
		console.log('recordingcallback', recordingStatus.isRecording);
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);

	/* Animations */
	// Button Press
	const buttonPressAnim = useRef(new Animated.Value(0)).current;
	const buttonGrow = buttonPressAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 80]
	});
	// const recordingLeftTranslateX = buttonPressAnim.interpolate({
	// 	inputRange: [0, 1],
	// 	outputRange: [40, 0]
	// });

	const animateButton = (from, to) => {
		buttonPressAnim.setValue(from);
		Animated.timing(
			buttonPressAnim,
			{
				toValue: to,
				duration: 180,
				easing: Easing.ease,
				useNativeDriver: true
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
		[{ nativeEvent: { x: touchX, y: touchY } }], { useNativeDriver: true }
	);

	const onLongPressStateChange = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				console.log('longpress active');
				touchY.setValue(0);
				touchX.setValue(0);
				setRecordingCancelled(false);
				setRecordingPersisted(false);
				if (!recordingStatus.isRecording) {
					// Start if not recording
					recordingInstance.current = new Audio.Recording();
					startRecordingAudio(recordingInstance.current, mode, recordingSettings, setRecordingStatus);
				} else if (recordingStatus.isRecording && recordingInstance.current) {
					// Cancel if already recording
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted, setRecordingStatus);
				}
				animateButton(0, 1);
				break;
			}

			case State.END: {
				console.log('longpress end');
				if (!recordingPersisted) {
					console.log('longpress nonrecordingpersisted', JSON.stringify(recordingStatus));
					if (recordingStatus.durationMillis > RECORDING_MINIMUM_DURATION && recordingStatus.isRecording) {
						console.log('finishrecordingaudio');
						// Finish recording as duration > RECORDING_MINIMUM_DURATION
						finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish, setRecordingStatus);
						animateButton(1, 0);
						break;
					}
					// Recording duration less than RECORDING_MINIMUM_DURATION. Show tooltip and cancel message
					console.log('cancellongpressrecordingaudio');
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted, setRecordingStatus);
					if (recordingStatus.durationMillis <= RECORDING_MINIMUM_DURATION && !recordingCancelled) {
						setShowRecordTooltip(true);
						setTimeout(() => {
							setShowRecordTooltip(false);
						}, 1500);
						animateButton(0.7, 0);
					}
				}
				break;
			}

			case State.CANCELLED: {
				console.log('longpress cancelled');
				break;
			}
			case State.FAILED: {
				console.log('longpress failed');
				break;
			}
			case State.UNDETERMINED: {
				console.log('longpress undertermined');
				break;
			}
			default:
				break;
		}
	};

	const onSwipeLeft = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				if (recordingInstance.current && recordingStatus.isRecording && !recordingCancelled && !recordingPersisted) {
					// Swipe left gesture, cancel message
					console.log('cancelledcall');
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted, setRecordingStatus);
					console.log(JSON.stringify(recordingStatus));
					animateButton(1, 0);
				}
				console.log('OnSwipeLeft active');
				break;
			}

			case State.END: {
				console.log('OnSwipeLeft end');
				break;
			}

			case State.CANCELLED: {
				console.log('OnSwipeLeft cancelled');
				break;
			}
			case State.FAILED: {
				console.log('OnSwipeLeft failed');
				break;
			}
			case State.UNDETERMINED: {
				console.log('OnSwipeLeft undertermined');
				break;
			}
			default:
				break;
		}
	};

	const onSwipeUp = ({ nativeEvent }) => {
		switch (nativeEvent.state) {
			case State.ACTIVE: {
				console.log('onSwipeUp active');
				if (recordingInstance.current && recordingStatus.isRecording && !recordingCancelled && !recordingPersisted) {
					// Swipe up gesture, persist recording
					buttonPressAnim.setValue(0);
					setRecordingPersisted(true);
				}
				break;
			}

			case State.END: {
				console.log('onSwipeUp end');
				break;
			}

			case State.CANCELLED: {
				console.log('onSwipeUp cancelled');
				break;
			}
			case State.FAILED: {
				console.log('onSwipeUp failed');
				break;
			}
			case State.UNDETERMINED: {
				console.log('onSwipeUp undertermined');
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
					finishRecordingAudio(recordingInstance.current, setRecordingPersisted, onFinish, setRecordingStatus);
				}}
			/>
		);

		centerContent = (
			<TouchableNativeFeedback
				style={{ height: 23 }}
				onPress={() => {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingPersisted, setRecordingStatus);
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
				simultaneousHandlers={[panRef, swipeUpRef, swipeLeftRef]}
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
					<CustomIcon name='mic' size={23} color={recordingStatus.isRecording ? themes[theme].focusedBackground : themes[theme].tintColor} />
					<Animated.View
						style={{
							backgroundColor: themes[theme].tintColor,
							position: 'absolute',
							width: 1,
							height: 1,
							zIndex: -1,
							borderRadius: 200,
							transform: [{ translateY: persistTranslateY }, { scale: buttonGrow }]
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
			position: 'absolute',
			bottom: '130%',
			right: 1,
			width: Dimensions.get('window').width,
			zIndex: 100
		}}
		>
			<View
				style={{
					backgroundColor: themes[theme].focusedBackground,
					alignSelf: 'flex-end',
					padding: 12,
					borderRadius: 4,
					opacity: 0.9
				}}
			>
				<Text style={{ color: themes[theme].infoText }}>
					Hold to record. Release to send
				</Text>
			</View>

		</View>
	) : null;

	const recordingLeft = recordingStatus.isRecording ? (
		<Animated.View style={[styles.textBoxInput, {
			flexDirection: 'row',
			flex: 3,
			marginHorizontal: 24
			// opacity: recordingPersisted ? 1 : buttonPressAnim,
			// transform: [{ translateX: recordingPersisted ? 0 : recordingLeftTranslateX }]
		}]}
		>
			<View style={{ flex: 1 }}>
				{currentTimeText}
			</View>
			<View style={{ flex: 2 }}>
				{centerContent}
			</View>
		</Animated.View>
	) : null;


	return (
		<>
			{recordingLeft}

			<PanGestureHandler
				ref={panRef}
				simultaneousHandlers={[longPressRef, swipeUpRef, swipeLeftRef]}
				onGestureEvent={onPanEvent}
			>
				<Animated.View>
					<PanGestureHandler
						ref={swipeLeftRef}
						simultaneousHandlers={[longPressRef, panRef, swipeUpRef]}
						onHandlerStateChange={onSwipeLeft}
						failOffsetY={-30}
						activeOffsetX={RECORDING_CANCEL_DISTANCE}
					>
						<Animated.View>
							<PanGestureHandler
								ref={swipeUpRef}
								simultaneousHandlers={[longPressRef, panRef, swipeLeftRef]}
								onHandlerStateChange={onSwipeUp}
								failOffsetX={-30}
								activeOffsetY={RECORDING_PERSIST_DISTANCE}
							>
								<Animated.View>
									{recordingButton}
									{recordTooltip}
								</Animated.View>
							</PanGestureHandler>
						</Animated.View>
					</PanGestureHandler>
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
