import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { Audio } from 'expo-av';
import {
	LongPressGestureHandler, State, PanGestureHandler
} from 'react-native-gesture-handler';
import { getInfoAsync } from 'expo-file-system';
import { deactivateKeepAwake, activateKeepAwake } from 'expo-keep-awake';
import Animated, { Easing } from 'react-native-reanimated';

import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withDimensions } from '../../dimensions';
import { isIOS, isAndroid } from '../../utils/deviceInfo';


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
const RECORDING_MINIMUM_DURATION = 300;	// Cancel if recording < this duration (in ms)
const RECORDING_DEFER_END = 300;	//  Ms to wait before android ends the recording.
const RECORDING_TOOLTIP_DURATION = 1500;	// Duration to show recording tooltip (in ms)
const RECORDING_CANCEL_DISTANCE = -120;	// Swipe left gesture to cancel recording

const RECORDING_TOOLTIP_TEXT = 'Hold to record. Release to send';
const RECORDING_SLIDE_TO_CANCEL_TEXT = 'Slide to cancel';


const formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

const {
	cond,
	eq,
	and,
	event,
	block,
	Value,
	set,
	call,
	Clock,
	startClock,
	stopClock,
	sub,
	greaterThan,
	timing,
	Extrapolate,
	neq,
	interpolate,
	lessThan
} = Animated;

function runButtonPressTimer(clock, toValue) {
	const state = {
		finished: new Value(0),
		position: new Value(0),
		time: new Value(0),
		frameTime: new Value(0)
	};

	const config = {
		duration: 180,
		toValue: new Value(-1),
		easing: Easing.inOut(Easing.ease)
	};

	return block([
		cond(and(neq(config.toValue, toValue)), [
			set(state.finished, 0),
			set(state.time, 0),
			set(state.frameTime, 0),
			set(config.toValue, toValue),
			startClock(clock)
		]),
		timing(clock, state, config),
		cond(state.finished, stopClock(clock)),
		interpolate(state.position, {
			inputRange: [0, 1],
			outputRange: [0, 80],
			extrapolate: Extrapolate.CLAMP
		})
	]);
}

class RecordAudio extends React.PureComponent {
	static propTypes = {
		theme: PropTypes.string,
		recordingCallback: PropTypes.func,
		onFinish: PropTypes.func,
		width: PropTypes.number
	}

	constructor(props) {
		super(props);

		this.isRecorderBusy = false;
		this.longPressRef = React.createRef();
		this.panRef = React.createRef();

		this.state = {
			isRecording: false,
			recordingDurationMillis: 0,
			isRecordingTooltipVisible: false
		};

		const touchX = new Value(0);
		const touchY = new Value(0);

		const buttonPressToValue = new Value(0);
		const buttonPressClock = new Clock();

		const isRecordingCancelled = new Value(0);

		const longPressClock = new Clock();
		const longPressStartTime = new Value(0);
		const isLongPressStarted = new Value(0);

		const isPanStarted = new Value(0);

		this._onLongPress = event([{
			nativeEvent: ({ state }) => block([

				cond(and(eq(state, State.ACTIVE), eq(isLongPressStarted, 0)), [
					set(isLongPressStarted, 1),
					set(isRecordingCancelled, 0),
					startClock(longPressClock),
					set(longPressStartTime, longPressClock),
					set(buttonPressToValue, 1),
					call([], () => this.startRecordingAudio())
				]),

				cond(and(eq(state, State.END), eq(isLongPressStarted, 1), eq(isIOS, 1)), [
					set(isLongPressStarted, 0),
					set(buttonPressToValue, 0),
					stopClock(longPressClock),
					cond(greaterThan(sub(longPressClock, longPressStartTime), RECORDING_MINIMUM_DURATION), [
						call([], () => this.finishRecordingAudio())
					], [
						call([], () => {
							setTimeout(() => {
								this.cancelRecordingAudio();
							}, RECORDING_DEFER_END);
							this.setState({ isRecordingTooltipVisible: true });
							setTimeout(() => {
								this.setState({ isRecordingTooltipVisible: false });
							}, RECORDING_TOOLTIP_DURATION);
						})
					])
				])
			])
		}]);

		this._onPan = event([{
			nativeEvent: ({ translationX, translationY, state }) => block([
				set(touchX, translationX),
				set(touchY, translationY),

				cond(eq(state, State.ACTIVE), [
					cond(eq(isPanStarted, 0), [
						set(isPanStarted, 1)
					]),
					cond(and(lessThan(translationX, RECORDING_CANCEL_DISTANCE), eq(isRecordingCancelled, 0)), [
						set(isRecordingCancelled, 1),
						call([], () => this.cancelRecordingAudio()),
						set(buttonPressToValue, 0)
					])
				]),

				cond(and(eq(state, State.END), eq(isPanStarted, 1)), [
					set(isPanStarted, 0),
					cond(isAndroid, [
						stopClock(longPressClock),
						cond(greaterThan(sub(longPressClock, longPressStartTime), RECORDING_MINIMUM_DURATION), [
							call([], () => {
								this.finishRecordingAudio();
							})
						], [
							call([], () => {
								setTimeout(() => {
									this.cancelRecordingAudio();
								}, RECORDING_DEFER_END);
								this.setState({ isRecordingTooltipVisible: true });
								setTimeout(() => {
									this.setState({ isRecordingTooltipVisible: false });
								}, RECORDING_TOOLTIP_DURATION);
							})
						])
					])
				])
			])
		}]);

		this._cancelTranslationX = cond(isPanStarted, touchX, 0);
		this._persistTranslationY = cond(isPanStarted, touchY, 0);
		this._buttonGrow = runButtonPressTimer(buttonPressClock, buttonPressToValue);
	}

	componentDidUpdate() {
		const { recordingCallback } = this.props;
		const { isRecording } = this.state;

		recordingCallback(isRecording);
	}

	componentWillUnmount() {
		if (this.recording) {
			this.cancelRecordingAudio();
		}
	}

	get duration() {
		const { recordingDurationMillis } = this.state;
		return formatTime(Math.floor(recordingDurationMillis / 1000));
	}

	isRecordingPermissionGranted = async() => {
		try {
			const permission = await Audio.getPermissionsAsync();
			if (permission.status === 'granted') {
				return true;
			}
			await Audio.requestPermissionsAsync();
		} catch {
			// Do nothing
		}
		return false;
	}

	onRecordingStatusUpdate = (status) => {
		this.setState({
			isRecording: status.isRecording,
			recordingDurationMillis: status.durationMillis
		});
	}

	startRecordingAudio = async() => {
		if (!this.isRecorderBusy) {
			this.isRecorderBusy = true;
			try {
				const canRecord = await this.isRecordingPermissionGranted();
				if (canRecord) {
					await Audio.setAudioModeAsync(RECORDING_MODE);

					this.recording = new Audio.Recording();
					await this.recording.prepareToRecordAsync(RECORDING_SETTINGS);
					this.recording.setOnRecordingStatusUpdate(this.onRecordingStatusUpdate);

					await this.recording.startAsync();
					activateKeepAwake();
				} else {
					await Audio.requestPermissionsAsync();
				}
			} catch (error) {
				// Do nothing
			}
			this.isRecorderBusy = false;
		}
	};

	finishRecordingAudio = async() => {
		if (!this.isRecorderBusy) {
			const { onFinish } = this.props;

			this.isRecorderBusy = true;
			try {
				await this.recording.stopAndUnloadAsync();

				const fileURI = this.recording.getURI();
				const fileData = await getInfoAsync(fileURI);
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
			this.setState({ isRecording: false, recordingDurationMillis: 0 });
			deactivateKeepAwake();
			this.isRecorderBusy = false;
		}
	};

	cancelRecordingAudio = async() => {
		if (!this.isRecorderBusy) {
			this.isRecorderBusy = true;
			try {
				await this.recording.stopAndUnloadAsync();
			} catch (error) {
				// Do nothing
			}
			this.setState({ isRecording: false, recordingDurationMillis: 0 });
			deactivateKeepAwake();
			this.isRecorderBusy = false;
		}
	};

	render() {
		const { theme, width } = this.props;
		const { isRecording, isRecordingTooltipVisible } = this.state;

		const buttonIconColor = isRecording ? themes[theme].focusedBackground : themes[theme].tintColor;

		return (
			<>
				{isRecordingTooltipVisible && (
					<View style={[styles.recordingTooltipContainer, { width }]}>
						<View
							style={[styles.recordingTooltip, {
								backgroundColor: themes[theme].bannerBackground,
								borderColor: themes[theme].borderColor
							}]}
						>
							<Text style={{ color: themes[theme].bodyText }}>
								{RECORDING_TOOLTIP_TEXT}
							</Text>
						</View>

					</View>
				)}

				{isRecording && (
					<Animated.View style={styles.recordingContent}>
						<Text
							style={[styles.recordingDurationText, { color: themes[theme].titleText }]}
						>
							{this.duration}
						</Text>
						<Animated.View style={[styles.recordingSlideToCancel, { transform: [{ translateX: this._cancelTranslationX }] }]}>
							<CustomIcon name='chevron-left' size={30} color={themes[theme].auxiliaryTintColor} />
							<Text style={[styles.cancelRecordingText, {
								color: themes[theme].auxiliaryText
							}]}
							>
								{RECORDING_SLIDE_TO_CANCEL_TEXT}
							</Text>
						</Animated.View>
					</Animated.View>
				)}

				<PanGestureHandler
					ref={this.panRef}
					simultaneousHandlers={[this.longPressRef]}
					onGestureEvent={this._onPan}
					onHandlerStateChange={this._onPan}
				>
					<Animated.View>
						<LongPressGestureHandler
							ref={this.longPressRef}
							simultaneousHandlers={[this.panRef]}
							onHandlerStateChange={this._onLongPress}
							minDurationMs={0}
						>
							<Animated.View
								style={styles.actionButton}
								testID='messagebox-send-audio'
								accessibilityLabel={I18n.t('Send_audio_message')}
								accessibilityTraits='button'
							>
								<CustomIcon style={{ zIndex: 1 }} name='mic' size={23} color={buttonIconColor} />
								<View style={{ position: 'absolute' }}>
									<Animated.View
										style={[styles.recordingButtonBubble, {
											backgroundColor: themes[theme].tintColor,
											transform: [{ translateY: this._persistTranslationY }, { scale: this._buttonGrow }]
										}]}
									/>
								</View>
							</Animated.View>
						</LongPressGestureHandler>
					</Animated.View>
				</PanGestureHandler>
			</>
		);
	}
}

export default withDimensions(RecordAudio);
