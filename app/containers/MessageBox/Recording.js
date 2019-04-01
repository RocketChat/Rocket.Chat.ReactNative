import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SafeAreaView, PermissionsAndroid, Text
} from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import { BorderlessButton } from 'react-native-gesture-handler';

import styles from './styles';
import I18n from '../../i18n';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_SUCCESS, COLOR_DANGER } from '../../constants/colors';

export const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

export default class extends React.PureComponent {
	static async permission() {
		if (!isAndroid) {
			return true;
		}

		const rationale = {
			title: I18n.t('Microphone_Permission'),
			message: I18n.t('Microphone_Permission_Message')
		};

		const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale);
		return result === true || result === PermissionsAndroid.RESULTS.GRANTED;
	}

	static propTypes = {
		onFinish: PropTypes.func.isRequired
	}

	constructor() {
		super();

		this.recordingCanceled = false;
		this.recording = true;
		this.state = {
			currentTime: '00:00'
		};
	}

	componentDidMount() {
		const audioPath = `${ AudioUtils.CachesDirectoryPath }/${ Date.now() }.aac`;

		AudioRecorder.prepareRecordingAtPath(audioPath, {
			SampleRate: 22050,
			Channels: 1,
			AudioQuality: 'Low',
			AudioEncoding: 'aac'
		});

		AudioRecorder.onProgress = (data) => {
			this.setState({
				currentTime: _formatTime(Math.floor(data.currentTime))
			});
		};
		//
		AudioRecorder.onFinished = (data) => {
			if (!this.recordingCanceled && isIOS) {
				this.finishRecording(data.status === 'OK', data.audioFileURL);
			}
		};
		AudioRecorder.startRecording();
	}

	componentWillUnmount() {
		if (this.recording) {
			this.cancelAudioMessage();
		}
	}

	finishRecording = (didSucceed, filePath) => {
		const { onFinish } = this.props;
		if (!didSucceed) {
			return onFinish && onFinish(didSucceed);
		}

		const path = filePath.startsWith('file://') ? filePath.split('file://')[1] : filePath;
		const fileInfo = {
			type: 'audio/aac',
			store: 'Uploads',
			path
		};
		return onFinish && onFinish(fileInfo);
	}

	finishAudioMessage = async() => {
		try {
			this.recording = false;
			const filePath = await AudioRecorder.stopRecording();
			if (isAndroid) {
				this.finishRecording(true, filePath);
			}
		} catch (err) {
			this.finishRecording(false);
		}
	}

	cancelAudioMessage = async() => {
		this.recording = false;
		this.recordingCanceled = true;
		await AudioRecorder.stopRecording();
		return this.finishRecording(false);
	}

	render() {
		const { currentTime } = this.state;

		return (
			<SafeAreaView
				key='messagebox-recording'
				testID='messagebox-recording'
				style={styles.textBox}
			>
				<View style={styles.textArea}>
					<BorderlessButton
						onPress={this.cancelAudioMessage}
						accessibilityLabel={I18n.t('Cancel_recording')}
						accessibilityTraits='button'
						style={styles.actionButton}
					>
						<CustomIcon
							size={22}
							color={COLOR_DANGER}
							name='cross'
						/>
					</BorderlessButton>
					<Text key='currentTime' style={styles.textBoxInput}>{currentTime}</Text>
					<BorderlessButton
						onPress={this.finishAudioMessage}
						accessibilityLabel={I18n.t('Finish_recording')}
						accessibilityTraits='button'
						style={styles.actionButton}
					>
						<CustomIcon
							size={22}
							color={COLOR_SUCCESS}
							name='check'
						/>
					</BorderlessButton>
				</View>
			</SafeAreaView>
		);
	}
}
