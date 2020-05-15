import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SafeAreaView, Text
} from 'react-native';
import { Audio } from 'expo-av';
import { BorderlessButton } from 'react-native-gesture-handler';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import RNFetchBlob from 'rn-fetch-blob';

import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';

export const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

const mode = {
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: false,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
};

export default class extends React.PureComponent {
	static async permission() {
		const { status } = await Audio.requestPermissionsAsync();
		return status === 'granted';
	}

	static propTypes = {
		theme: PropTypes.string,
		onFinish: PropTypes.func.isRequired
	}

	constructor() {
		super();

		this.recordingCanceled = false;
		this.recording = true;
		this.name = `${ Date.now() }.aac`;
		this.state = {
			currentTime: '00:00'
		};

		this.recordingInstance = new Audio.Recording();
		this.recordingSettings = {
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
	}

	async componentDidMount() {
		try {
			await Audio.setAudioModeAsync(mode);
			await this.recordingInstance.prepareToRecordAsync(this.recordingSettings);

			this.recordingInstance.setOnRecordingStatusUpdate((status) => {
				this.setState({
					currentTime: _formatTime(Math.floor(status.durationMillis / 1000))
				});
			});
			await this.recordingInstance.startAsync();
		} catch (error) {
			// Do nothing
		}

		activateKeepAwake();
	}

	componentWillUnmount() {
		if (this.recording) {
			this.cancelAudioMessage();
		}

		deactivateKeepAwake();
	}

	finishRecording = (didSucceed, filePath, size) => {
		const { onFinish } = this.props;
		if (!didSucceed) {
			return onFinish && onFinish(didSucceed);
		}

		const fileInfo = {
			name: this.name,
			mime: 'audio/aac',
			type: 'audio/aac',
			store: 'Uploads',
			path: filePath,
			size
		};
		return onFinish && onFinish(fileInfo);
	}

	finishAudioMessage = async() => {
		try {
			const fileURI = this.recordingInstance.getURI();
			const fileData = await RNFetchBlob.fs.stat(this.uriToPath(fileURI));

			this.recording = false;
			await this.recordingInstance.stopAndUnloadAsync();
			this.finishRecording(true, fileURI, fileData.size);
		} catch (err) {
			this.finishRecording(false);
		}
	}

	cancelAudioMessage = async() => {
		this.recording = false;
		this.recordingCanceled = true;
		await this.recordingInstance.stopAndUnloadAsync();
		return this.finishRecording(false);
	}

	uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	render() {
		const { currentTime } = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView
				testID='messagebox-recording'
				style={[
					styles.textBox,
					{ borderTopColor: themes[theme].borderColor }
				]}
			>
				<View style={[styles.textArea, { backgroundColor: themes[theme].messageboxBackground }]}>
					<BorderlessButton
						onPress={this.cancelAudioMessage}
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
					<Text key='currentTime' style={[styles.textBoxInput, { color: themes[theme].titleText }]}>{currentTime}</Text>
					<BorderlessButton
						onPress={this.finishAudioMessage}
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
			</SafeAreaView>
		);
	}
}
