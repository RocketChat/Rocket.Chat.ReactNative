import React from 'react';
import { Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { BorderlessButton } from 'react-native-gesture-handler';
import { getInfoAsync } from 'expo-file-system';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { events, logEvent } from '../../utils/log';

interface IMessageBoxRecordAudioProps {
	theme: string;
	permissionToUpload: boolean;
	recordingCallback: Function;
	onFinish: Function;
}

const RECORDING_EXTENSION = '.m4a';
const RECORDING_SETTINGS = {
	android: {
		extension: RECORDING_EXTENSION,
		outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
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
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
};

const formatTime = function (seconds: any) {
	let minutes: any = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) {
		minutes = `0${minutes}`;
	}
	if (seconds < 10) {
		seconds = `0${seconds}`;
	}
	return `${minutes}:${seconds}`;
};

export default class RecordAudio extends React.PureComponent<IMessageBoxRecordAudioProps, any> {
	private isRecorderBusy: boolean;

	private recording: any;

	private LastDuration: number;

	constructor(props: IMessageBoxRecordAudioProps) {
		super(props);
		this.isRecorderBusy = false;
		this.LastDuration = 0;
		this.state = {
			isRecording: false,
			isRecorderActive: false,
			recordingDurationMillis: 0
		};
	}

	componentDidUpdate() {
		const { recordingCallback } = this.props;
		const { isRecorderActive } = this.state;

		recordingCallback(isRecorderActive);
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

	get GetLastDuration() {
		return formatTime(Math.floor(this.LastDuration / 1000));
	}

	isRecordingPermissionGranted = async () => {
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
	};

	onRecordingStatusUpdate = (status: any) => {
		this.setState({
			isRecording: status.isRecording,
			recordingDurationMillis: status.durationMillis
		});
		this.LastDuration = status.durationMillis;
	};

	startRecordingAudio = async () => {
		logEvent(events.ROOM_AUDIO_RECORD);
		if (!this.isRecorderBusy) {
			this.isRecorderBusy = true;
			this.LastDuration = 0;
			try {
				const canRecord = await this.isRecordingPermissionGranted();
				if (canRecord) {
					await Audio.setAudioModeAsync(RECORDING_MODE);

					this.setState({ isRecorderActive: true });
					this.recording = new Audio.Recording();
					await this.recording.prepareToRecordAsync(RECORDING_SETTINGS);
					this.recording.setOnRecordingStatusUpdate(this.onRecordingStatusUpdate);

					await this.recording.startAsync();
					activateKeepAwake();
				} else {
					await Audio.requestPermissionsAsync();
				}
			} catch (error) {
				logEvent(events.ROOM_AUDIO_RECORD_F);
			}
			this.isRecorderBusy = false;
		}
	};

	finishRecordingAudio = async () => {
		logEvent(events.ROOM_AUDIO_FINISH);
		if (!this.isRecorderBusy) {
			const { onFinish } = this.props;

			this.isRecorderBusy = true;
			try {
				await this.recording.stopAndUnloadAsync();

				const fileURI = this.recording.getURI();
				const fileData = await getInfoAsync(fileURI);
				const fileInfo = {
					name: `${Date.now()}.m4a`,
					mime: 'audio/aac',
					type: 'audio/aac',
					store: 'Uploads',
					path: fileURI,
					size: fileData.size
				};

				onFinish(fileInfo);
			} catch (error) {
				logEvent(events.ROOM_AUDIO_FINISH_F);
			}
			this.setState({ isRecording: false, isRecorderActive: false, recordingDurationMillis: 0 });
			deactivateKeepAwake();
			this.isRecorderBusy = false;
		}
	};

	cancelRecordingAudio = async () => {
		logEvent(events.ROOM_AUDIO_CANCEL);
		if (!this.isRecorderBusy) {
			this.isRecorderBusy = true;
			try {
				await this.recording.stopAndUnloadAsync();
			} catch (error) {
				logEvent(events.ROOM_AUDIO_CANCEL_F);
			}
			this.setState({ isRecording: false, isRecorderActive: false, recordingDurationMillis: 0 });
			deactivateKeepAwake();
			this.isRecorderBusy = false;
		}
	};

	render() {
		const { theme, permissionToUpload } = this.props;
		const { isRecording, isRecorderActive } = this.state;
		if (!permissionToUpload) {
			return null;
		}
		if (!isRecording && !isRecorderActive) {
			return (
				<BorderlessButton
					onPress={this.startRecordingAudio}
					style={styles.actionButton}
					testID='messagebox-send-audio'
					// @ts-ignore
					accessibilityLabel={I18n.t('Send_audio_message')}
					accessibilityTraits='button'>
					<CustomIcon name='microphone' size={24} color={themes[theme].auxiliaryTintColor} />
				</BorderlessButton>
			);
		}

		if (!isRecording && isRecorderActive) {
			return (
				<View style={styles.recordingContent}>
					<View style={styles.textArea}>
						<BorderlessButton
							onPress={this.cancelRecordingAudio}
							// @ts-ignore
							accessibilityLabel={I18n.t('Cancel_recording')}
							accessibilityTraits='button'
							style={styles.actionButton}>
							<CustomIcon size={24} color={themes[theme].dangerColor} name='delete' />
						</BorderlessButton>
						<Text style={[styles.recordingDurationText, { color: themes[theme].titleText }]}>{this.GetLastDuration}</Text>
					</View>
					<BorderlessButton
						onPress={this.finishRecordingAudio}
						// @ts-ignore
						accessibilityLabel={I18n.t('Finish_recording')}
						accessibilityTraits='button'
						style={styles.actionButton}>
						<CustomIcon size={24} color={themes[theme].tintColor} name='send-filled' />
					</BorderlessButton>
				</View>
			);
		}

		return (
			<View style={styles.recordingContent}>
				<View style={styles.textArea}>
					<BorderlessButton
						onPress={this.cancelRecordingAudio}
						// @ts-ignore
						accessibilityLabel={I18n.t('Cancel_recording')}
						accessibilityTraits='button'
						style={styles.actionButton}>
						<CustomIcon size={24} color={themes[theme].dangerColor} name='delete' />
					</BorderlessButton>
					<Text style={[styles.recordingDurationText, { color: themes[theme].titleText }]}>{this.duration}</Text>
					<CustomIcon size={24} color={themes[theme].dangerColor} name='record' />
				</View>
				<BorderlessButton
					onPress={this.finishRecordingAudio}
					// @ts-ignore
					accessibilityLabel={I18n.t('Finish_recording')}
					accessibilityTraits='button'
					style={styles.actionButton}>
					<CustomIcon size={24} color={themes[theme].tintColor} name='send-filled' />
				</BorderlessButton>
			</View>
		);
	}
}
