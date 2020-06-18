import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
	Animated, View, Text, Platform, TouchableOpacity, Easing
} from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import RNFetchBlob from 'rn-fetch-blob';
import {
	PanGestureHandler, State, LongPressGestureHandler
} from 'react-native-gesture-handler';
import { useDimensions } from '@react-native-community/hooks';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { mode as playbackMode } from '../message/Audio';
import { SendButton } from './buttons';

const RECORDING_PERSIST_DISTANCE = -80;	// Swipe up gesture to persist recording
const RECORDING_CANCEL_DISTANCE = -120;	// Swipe left gesture to cancel recording
const RECORDING_DEFER_END_ANDROID = 300;	//  Ms to wait before android ends the recording.
const RECORDING_MINIMUM_DURATION = 300;	// Cancel if recording < this duration (in ms)
const RECORDING_TOOLTIP_DURATION = 1500;	// Duration to show recording tooltip (in ms)

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

const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
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

const finishRecordingAudio = async(instance, onFinish, setRecordingStatus, setRecordingPersisted) => {
	const uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));
	setRecordingPersisted(false);
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

const cancelAudioMessage = async(instance, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted) => {
	try {
		await Audio.setAudioModeAsync(playbackMode);
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
		return onFinish && onFinish(false);
	} catch (error) {
		await Audio.setAudioModeAsync(playbackMode);
		console.log(error);
	}
};

const RecordAudio = ({ theme, recordingCallback, onFinish }) => {
	/* Refs */
	const recordingInstance = useRef(null);
	const panRef = useRef(null);
	const swipeLeftRef = useRef(null);
	const swipeUpRef = useRef(null);
	const longPressRef = useRef(null);

	/* State */
	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});
	const [recordingCancelled, setRecordingCancelled] = useState(false);
	const [recordingPersisted, setRecordingPersisted] = useState(false);
	const [showRecordingTooltip, setShowRecordingTooltip] = useState(false);
	const [timePressed, setTimePressed] = useState(0);

	const { width } = useDimensions().window;

	/* Effects */
	useEffect(() => {
		recordingCallback(recordingStatus.isRecording);
	}, [recordingStatus.isRecording]);

	/* Animation */
	// Pan
	const touchX = useRef(new Animated.Value(0)).current;
	const touchY = useRef(new Animated.Value(0)).current;

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

	/* Functions */

	/* Gesture states
		ios:
			Gesture Flow: tap (active) -> start panning -> pan (active) -> stop panning -> pan (end) -> tap (end)
			startrecording: tap active
			stoprecording: tap end

		android:
			Gesture Flow: tap (active) -> pan (active) -> start panning (tap cancel) -> stop panning (pan end)
			startrecording: tap active
			stoprecording: pan end
	*/

	const onPanEvent = Animated.event(
		[{ nativeEvent: { x: touchX, y: touchY } }],
		{ useNativeDriver: true }
	);

	const onSwipeLeft = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE && recordingInstance.current && recordingStatus.isRecording && !recordingCancelled && !recordingPersisted) {
			animateButton(1, 0);
			cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted);
		}
	};

	const onSwipeUp = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE && !recordingCancelled) {
			setRecordingPersisted(true);
		}
	};

	const onLongPress = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE) {
			touchX.setValue(0);
			touchY.setValue(0);
			if (recordingStatus.isRecording) {
				cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted);
			} else {
				setTimePressed(new Date());
				setRecordingCancelled(false);
				setRecordingPersisted(false);
				recordingInstance.current = new Audio.Recording();
				startRecordingAudio(recordingInstance.current, setRecordingStatus);
				animateButton(0, 1);
			}
		} else if (nativeEvent.state === State.END && Platform.OS === 'ios' && !recordingPersisted && !recordingCancelled) {
			const durationPressed = new Date() - timePressed;
			if (durationPressed > RECORDING_MINIMUM_DURATION) {
				finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus, setRecordingPersisted);
				animateButton(1, 0);
			} else {
				setShowRecordingTooltip(true);
				cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted);
				animateButton(1, 0);
				setTimeout(() => {
					setShowRecordingTooltip(false);
				}, RECORDING_TOOLTIP_DURATION);
			}
		}
	};

	const onPan = ({ nativeEvent }) => {
		if (nativeEvent.state === State.END && Platform.OS === 'android' && !recordingPersisted && !recordingCancelled) {
			const durationPressed = new Date() - timePressed;
			if (durationPressed > RECORDING_MINIMUM_DURATION) {
				animateButton(1, 0);
				setTimeout(() => {
					finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus, setRecordingPersisted);
				}, RECORDING_DEFER_END_ANDROID);
			} else {
				setShowRecordingTooltip(true);
				setTimeout(() => {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted);
				}, RECORDING_DEFER_END_ANDROID);
				animateButton(1, 0);
				setTimeout(() => {
					setShowRecordingTooltip(false);
				}, RECORDING_TOOLTIP_DURATION);
			}
		}
	};


	/* UI */

	let centerContent;
	let recordingButton;

	if (recordingPersisted) {
		centerContent = (
			<TouchableOpacity
				style={styles.recordingCancelButton}
				onPress={() => {
					cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus, setRecordingPersisted);
				}}
			>
				<Text style={[styles.cancelRecordingText, { color: themes[theme].tintColor, textAlign: 'right' }]}>
					Cancel
				</Text>
			</TouchableOpacity>
		);

		recordingButton = (
			<SendButton
				theme={theme}
				onPress={() => {
					finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus, setRecordingPersisted);
				}}
			/>
		);
	} else {
		centerContent = (
			<Animated.View style={[styles.recordingSlideToCancel, { transform: [{ translateX: cancelTranslateX }] }]}>
				<CustomIcon name='chevron-left' size={30} color={themes[theme].auxiliaryTintColor} />
				<Text style={[styles.cancelRecordingText, {
					color: themes[theme].auxiliaryText,
					textAlign: 'right'
				}]}
				>
					Slide to cancel
				</Text>
			</Animated.View>
		);

		recordingButton = (
			<LongPressGestureHandler
				ref={longPressRef}
				simultaneousHandlers={[swipeLeftRef, panRef, swipeUpRef]}
				onHandlerStateChange={onLongPress}
				minDurationMs={0}
			>
				<Animated.View
					style={styles.actionButton}
					testID='messagebox-send-audio'
					accessibilityLabel={I18n.t('Send_audio_message')}
					accessibilityTraits='button'
				>
					<CustomIcon style={{ zIndex: 1 }} name='mic' size={23} color={recordingStatus.isRecording ? themes[theme].focusedBackground : themes[theme].tintColor} />
					<View style={{ position: 'absolute' }}>
						<Animated.View
							style={[styles.recordingButtonBubble, {
								backgroundColor: themes[theme].tintColor,
								transform: [{ translateY: persistTranslateY }, { scale: buttonGrow }]
							}]}
						/>
					</View>
				</Animated.View>
			</LongPressGestureHandler>
		);
	}

	const recordTooltip = showRecordingTooltip ? (
		<View style={[styles.recordingTooltipContainer, { width }]}>
			<View
				style={[styles.recordingTooltip, {
					backgroundColor: themes[theme].bannerBackground,
					borderColor: themes[theme].borderColor
				}]}
			>
				<Text style={{ color: themes[theme].bodyText }}>
					Hold to record. Release to send
				</Text>
			</View>

		</View>
	) : null;


	const recordingContent = recordingStatus.isRecording ? (
		<Animated.View style={[styles.textBoxInput, styles.recordingContent]}>
			<View style={{ flex: 1 }}>
				<Text
					key='currentTime'
					style={[styles.cancelRecordingText, { color: themes[theme].titleText }]}
				>
					{_formatTime(Math.floor(recordingStatus.durationMillis / 1000))}
				</Text>
			</View>
			<View style={{ flex: 2 }}>
				{centerContent}
			</View>
		</Animated.View>
	) : null;

	return (
		<>
			{recordingContent}
			<PanGestureHandler
				ref={panRef}
				simultaneousHandlers={[swipeLeftRef, longPressRef, swipeUpRef]}
				onGestureEvent={onPanEvent}
				onHandlerStateChange={onPan}
			>
				<Animated.View>
					<PanGestureHandler
						ref={swipeLeftRef}
						simultaneousHandlers={[panRef, longPressRef, swipeUpRef]}
						activeOffsetX={RECORDING_CANCEL_DISTANCE}
						onHandlerStateChange={onSwipeLeft}
					>
						<Animated.View>
							<PanGestureHandler
								ref={swipeUpRef}
								simultaneousHandlers={[longPressRef, panRef, swipeLeftRef]}
								onHandlerStateChange={onSwipeUp}
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
};

RecordAudio.propTypes = {
	theme: PropTypes.string,
	recordingCallback: PropTypes.func,
	onFinish: PropTypes.func
};

export default RecordAudio;
