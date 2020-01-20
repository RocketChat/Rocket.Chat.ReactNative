import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SafeAreaView, PermissionsAndroid, Text
} from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import { BorderlessButton } from 'react-native-gesture-handler';
import RNFetchBlob from 'rn-fetch-blob';

import styles from './styles';
import I18n from '../../i18n';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';

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
	}

	componentDidMount() {
		const audioPath = `${ AudioUtils.CachesDirectoryPath }/${ this.name }`;

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
				this.finishRecording(data.status === 'OK', data.audioFileURL, data.audioFileSize);
			}
		};
		AudioRecorder.startRecording();
	}

	componentWillUnmount() {
		if (this.recording) {
			this.cancelAudioMessage();
		}
	}

	finishRecording = (didSucceed, filePath, size) => {
		const { onFinish } = this.props;
		if (!didSucceed) {
			return onFinish && onFinish(didSucceed);
		}
		if (isAndroid) {
			filePath = filePath.startsWith('file://') ? filePath : `file://${ filePath }`;
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
			this.recording = false;
			const filePath = await AudioRecorder.stopRecording();
			if (isAndroid) {
				const data = await RNFetchBlob.fs.stat(decodeURIComponent(filePath));
				this.finishRecording(true, filePath, data.size);
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
							name='cross'
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
