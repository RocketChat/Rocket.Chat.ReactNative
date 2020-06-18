import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
	Animated, View, Text, Platform
} from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import RNFetchBlob from 'rn-fetch-blob';
import {
	PanGestureHandler, State, LongPressGestureHandler
} from 'react-native-gesture-handler';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { mode as playbackMode } from '../message/Audio';

const RECORDING_CANCEL_DISTANCE = -120;	// Swipe left gesture to cancel recording
const RECORDING_GESTURE_FAIL_DISTANCE = -30;	// Fail gesture with this amount of pan
const RECORDING_DEFER_END_ANDROID = 500;	//  Ms to wait before android ends the recording.

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

const cancelAudioMessage = async(instance, onFinish, setRecordingCancelled, setRecordingStatus) => {
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
	const longPressRef = useRef(null);

	/* State */
	const [recordingStatus, setRecordingStatus] = useState({
		canRecord: false,
		isRecording: false,
		durationMillis: 0,
		isDoneRecording: false
	});
	const [recordingCancelled, setRecordingCancelled] = useState(false);

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
		if (nativeEvent.state === State.ACTIVE && recordingInstance.current && recordingStatus.isRecording && !recordingCancelled) {
			cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus);
		}
	};

	const onLongPress = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE) {
			touchX.setValue(0);
			touchY.setValue(0);
			if (recordingStatus.isRecording) {
				cancelAudioMessage(recordingInstance.current, onFinish, setRecordingCancelled, setRecordingStatus);
			} else {
				setRecordingCancelled(false);
				recordingInstance.current = new Audio.Recording();
				startRecordingAudio(recordingInstance.current, setRecordingStatus);
			}
		} else if (nativeEvent.state === State.END && Platform.OS === 'ios') {
			finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus);
		}
	};

	const onPan = ({ nativeEvent }) => {
		if (nativeEvent.state === State.END && Platform.OS === 'android') {
			setTimeout(() => {
				finishRecordingAudio(recordingInstance.current, onFinish, setRecordingStatus);
			}, RECORDING_DEFER_END_ANDROID);
		}
	};


	/* UI */

	const centerContent = (
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

	const recordingButton = (
		<LongPressGestureHandler
			ref={longPressRef}
			simultaneousHandlers={[swipeLeftRef, panRef]}
			onHandlerStateChange={onLongPress}
			minDurationMs={0}
		>
			<Animated.View
				style={styles.actionButton}
				testID='messagebox-send-audio'
				accessibilityLabel={I18n.t('Send_audio_message')}
				accessibilityTraits='button'
			>
				<CustomIcon name='mic' size={23} color={recordingStatus.isRecording ? themes[theme].focusedBackground : themes[theme].tintColor} />
			</Animated.View>
		</LongPressGestureHandler>
	);

	return (
		<>
			{recordingContent}
			<PanGestureHandler
				ref={panRef}
				simultaneousHandlers={[swipeLeftRef, longPressRef]}
				onGestureEvent={onPanEvent}
				onHandlerStateChange={onPan}
			>
				<Animated.View>
					<PanGestureHandler
						ref={swipeLeftRef}
						simultaneousHandlers={[panRef, longPressRef]}
						failOffsetY={RECORDING_GESTURE_FAIL_DISTANCE}
						activeOffsetX={RECORDING_CANCEL_DISTANCE}
						onHandlerStateChange={onSwipeLeft}
					>
						<Animated.View>
							{recordingButton}
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
