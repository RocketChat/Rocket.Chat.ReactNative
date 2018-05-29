import React from 'react';
import PropTypes from 'prop-types';
import { View, SafeAreaView, Platform, PermissionsAndroid, Text } from 'react-native';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './styles';

export const _formatTime = function(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds %= 60;
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }
	return `${ minutes }:${ seconds }`;
};

export default class extends React.PureComponent {
	static propTypes = {
		onFinish: PropTypes.func.isRequired
	}

	static async permission() {
		if (Platform.OS !== 'android') {
			return true;
		}

		const rationale = {
			title: 'Microphone Permission',
			message: 'Rocket Chat needs access to your microphone so you can send audio message.'
		};

		const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale);
		return result === true || result === PermissionsAndroid.RESULTS.GRANTED;
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
			if (!this.recordingCanceled && Platform.OS === 'ios') {
				this._finishRecording(data.status === 'OK', data.audioFileURL);
			}
		};
		AudioRecorder.startRecording();
	}

	componentWillUnmount() {
		if (this.recording) {
			this.cancelAudioMessage();
		}
	}

	_finishRecording(didSucceed, filePath) {
		if (!didSucceed) {
			return this.props.onFinish && this.props.onFinish(didSucceed);
		}

		const path = filePath.startsWith('file://') ? filePath.split('file://')[1] : filePath;
		const fileInfo = {
			type: 'audio/aac',
			store: 'Uploads',
			path
		};
		return this.props.onFinish && this.props.onFinish(fileInfo);
	}

	finishAudioMessage = async() => {
		try {
			this.recording = false;
			const filePath = await AudioRecorder.stopRecording();
			if (Platform.OS === 'android') {
				this._finishRecording(true, filePath);
			}
		} catch (err) {
			this._finishRecording(false);
			console.error(err);
		}
	}

	cancelAudioMessage = async() => {
		this.recording = false;
		this.recordingCanceled = true;
		await AudioRecorder.stopRecording();
		return this._finishRecording(false);
	}

	render() {
		return (
			<SafeAreaView
				key='messagebox-recording'
				testID='messagebox-recording'
				style={styles.textBox}
			>
				<View style={[styles.textArea, { backgroundColor: '#F6F7F9' }]}>
					<Icon
						style={[styles.actionButtons, { color: 'red' }]}
						name='clear'
						key='clear'
						accessibilityLabel='Cancel recording'
						accessibilityTraits='button'
						onPress={this.cancelAudioMessage}
					/>
					<Text key='currentTime' style={styles.textBoxInput}>{this.state.currentTime}</Text>
					<Icon
						style={[styles.actionButtons, { color: 'green' }]}
						name='check'
						key='check'
						accessibilityLabel='Finish recording'
						accessibilityTraits='button'
						onPress={this.finishAudioMessage}
					/>
				</View>
			</SafeAreaView>);
	}
}
