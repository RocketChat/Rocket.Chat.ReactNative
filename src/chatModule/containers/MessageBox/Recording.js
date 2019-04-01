import React from "react";
import PropTypes from "prop-types";
import {
  View,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  Text
} from "react-native";
import { Audio, FileSystem, Permissions } from "expo";
import Icon from "@expo/vector-icons/MaterialIcons";
import { compose, hoistStatics } from "recompose";
import i18n from "i18n-js";

import styles from "./styles";

export const _formatTime = function(seconds) {
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `${minutes}:${seconds}`;
};

class Recording extends React.PureComponent {
  static async permission() {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    return response.status === "granted";
  }
  static propTypes = {
    onFinish: PropTypes.func.isRequired
  };

  constructor() {
    super();

    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.intervalId = null;
    this.state = {
      haveRecordingPermissions: false,
      isLoading: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0
    };
  }

  async componentDidMount() {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);

    if (response.status === "granted") {
      this.setState({
        haveRecordingPermissions: true
      });
      this._onRecordPressed();
    }
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  _updateScreenForSoundStatus = status => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        shouldCorrectPitch: status.shouldCorrectPitch,
        isPlaybackAllowed: true
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  _updateScreenForRecordingStatus = status => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis
      });
      if (!this.state.isLoading) {
        this._stopRecordingAndEnablePlayback();
      }
    }
  };

  async _stopPlaybackAndBeginRecording() {
    this.setState({
      isLoading: true
    });

    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: true
    });
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: ".aac",
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 22050,
        numberOfChannels: 1
      },
      ios: {
        extension: ".aac",
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW,
        sampleRate: 22050,
        numberOfChannels: 1
      }
    });
    recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus);

    this.recording = recording;
    this.startDuration();
    await this.recording.startAsync(); // Will call this._updateScreenForRecordingStatus to update the screen.
    this.setState({
      isLoading: false
    });
  }

  async _stopRecordingAndEnablePlayback() {
    this.setState({
      isLoading: true
    });
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      // Do nothing -- we are already unloaded.
    }
    const info = await FileSystem.getInfoAsync(this.recording.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: true
    });
    const { sound, status } = await this.recording.createNewLoadedSoundAsync(
      {
        isLooping: true,
        isMuted: this.state.muted,
        volume: this.state.volume,
        rate: this.state.rate,
        shouldCorrectPitch: this.state.shouldCorrectPitch
      },
      this._updateScreenForSoundStatus
    );
    this.sound = sound;
    this.setState({
      isLoading: false
    });
  }

  _onRecordPressed = () => {
    this.setState({
      soundDuration: 0
    });
    clearInterval(this.intervalId);
    if (this.state.isRecording) {
      this._stopRecordingAndEnablePlayback();
    } else {
      this._stopPlaybackAndBeginRecording();
    }
  };

  _onPlayPausePressed = () => {
    if (this.sound != null) {
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
      } else {
        this.sound.playAsync();
      }
    }
  };

  _onStopPressed = () => {
    if (this.sound != null) {
      this.sound.stopAsync();
    }
  };

  _finishRecording = (didSucceed, filePath) => {
    if (!didSucceed) {
      return this.props.onFinish && this.props.onFinish(didSucceed);
    }

    // const path = filePath.startsWith("file://")
    //   ? filePath.split("file://")[1]
    //   : filePath;
    const fileInfo = {
      type: "audio/aac",
      store: "Uploads",
      path: filePath
    };
    return this.props.onFinish && this.props.onFinish(fileInfo);
  };

  finishAudioMessage = async () => {
    if (this.state.isRecording) {
      this._onRecordPressed();
    } else {
      try {
        const info = await FileSystem.getInfoAsync(this.recording.getURI());
        this._finishRecording(true, info.uri);
      } catch (err) {
        this._finishRecording(false);
        console.error(err);
      }
    }
  };

  cancelAudioMessage = async () => {
    clearInterval(this.intervalId);
    // await AudioRecorder.stopRecording();
    return this._finishRecording(false);
  };

  addDuration = () => {
    let duration = this.state.soundDuration
      ? this.state.soundDuration + 1000
      : 1000;

    if (duration <= 59000) {
      this.setState({
        soundDuration: duration
      });
    } else {
      this._onRecordPressed();
    }
  };

  startDuration = () => {
    this.intervalId = setInterval(this.addDuration, 1000);
  };

  render() {
    return this.state.haveRecordingPermissions ? (
      <SafeAreaView
        key="messagebox-recording"
        testID="messagebox-recording"
        style={styles.textBox}
      >
        <View style={[styles.textArea, { backgroundColor: "#F6F7F9" }]}>
          <Icon
            style={[styles.actionButtons, { color: "red" }]}
            name="clear"
            key="clear"
            accessibilityLabel={i18n.t("ran.chat.Cancel_recording")}
            accessibilityTraits="button"
            onPress={this.cancelAudioMessage}
          />
          <Text key="soundDuration" style={styles.textBoxInput}>
            {this.state.soundDuration
              ? _formatTime(Math.round(this.state.soundDuration / 1000))
              : i18n.t("ran.chat.recording")}
          </Text>
          {this.state.isRecording ? (
            <Icon
              style={[styles.actionButtons, { color: "green" }]}
              name="check"
              key="check"
              accessibilityLabel={i18n.t("ran.chat.Finish_recording")}
              accessibilityTraits="button"
              onPress={this.finishAudioMessage}
            />
          ) : (
            <Icon
              style={[styles.actionButtons, { color: "#1D74F5" }]}
              name="send"
              key="sendIcon"
              accessibilityLabel={i18n.t("ran.chat.Finish_recording")}
              accessibilityTraits="button"
              onPress={this.finishAudioMessage}
            />
          )}
        </View>
      </SafeAreaView>
    ) : (
      <Text style={[styles.textArea, { backgroundColor: "#F6F7F9" }]}>
        {i18n.t("ran.chat.Not_haveRecordingPermissions")}
      </Text>
    );
  }
}

export default Recording;
