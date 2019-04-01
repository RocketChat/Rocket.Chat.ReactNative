import React from "react";
import PropTypes from "prop-types";
import { View, StyleSheet, Text, Easing } from "react-native";
import * as Expo from "expo";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import Slider from "react-native-slider";
import moment from "moment";
import { BorderlessButton } from "react-native-gesture-handler";

import Markdown from "./Markdown";

const styles = StyleSheet.create({
  audioContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "#f7f8fa",
    borderRadius: 4,
    marginBottom: 10
  },
  playPauseButton: {
    width: 56,
    alignItems: "center",
    backgroundColor: "transparent"
  },
  playPauseImage: {
    width: 30,
    height: 30
  },
  slider: {
    flex: 1,
    marginRight: 10
  },
  duration: {
    marginRight: 16,
    fontSize: 14,
    fontWeight: "500",
    color: "#54585e"
  },
  thumbStyle: {
    width: 12,
    height: 12
  }
});

// const formatTime = miniseconds => moment.utc(miniseconds).format("mm:ss");
const formatTime = function(seconds) {
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
const LOOPING_TYPE_ALL = 0;
const LOOPING_TYPE_ONE = 1;

export default class Audio extends React.PureComponent {
  static propTypes = {
    file: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
    customEmojis: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const { baseUrl, file, user } = props;
    this.playbackInstance = null;
    this.state = {
      isPlaying: false,
      isBuffering: false,
      shouldPlay: false,
      playing: false,
      rate: 1.0,
      volume: 1.0,
      muted: false,
      playbackInstancePosition: 0,
      playbackInstanceDuration: 0,
      shouldCorrectPitch: true,
      loopingType: LOOPING_TYPE_ALL,
      paused: true,
      uri: `${baseUrl}${file.audio_url}?rc_uid=${user.id}&rc_token=${
        user.token
      }`
    };
  }

  async componentDidMount() {
    const source = { uri: this.state.uri };
    const initialStatus = {
      shouldPlay: this.state.playing,
      rate: this.state.rate,
      shouldCorrectPitch: this.state.shouldCorrectPitch,
      volume: this.state.volume,
      isMuted: this.state.muted,
      isLooping: this.state.loopingType === LOOPING_TYPE_ONE
      // // UNCOMMENT THIS TO TEST THE OLD androidImplementation:
      // androidImplementation: 'MediaPlayer',
    };
    const { sound, status } = await Expo.Audio.Sound.createAsync(
      source,
      initialStatus,
      this._onPlaybackStatusUpdate
    );
    this.playbackInstance = sound;
  }

  _onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      this.setState({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        loopingType: status.isLooping ? LOOPING_TYPE_ONE : LOOPING_TYPE_ALL,
        shouldCorrectPitch: status.shouldCorrectPitch
      });
      if (status.didJustFinish && !status.isLooping) {
        this.setState({
          playbackInstancePosition: 0,
          paused: !this.state.paused
        });
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  getDuration = () => {
    return this.state.playbackInstancePosition
      ? formatTime(Math.round(this.state.playbackInstancePosition / 1000))
      : formatTime(Math.round(this.state.playbackInstanceDuration / 1000));
  };

  togglePlayPause = () => {
    console.log(this.state);

    if (this.playbackInstance != null) {
      if (this.state.isPlaying) {
        this.playbackInstance.pauseAsync();
      } else {
        if (
          this.state.playbackInstancePosition <
          this.state.playbackInstanceDuration - 100
        ) {
          this.playbackInstance.playAsync();
        } else {
          this.playbackInstance.replayAsync();
        }
      }
    }

    this.setState({
      paused: !this.state.paused
    });
  };

  render() {
    const { paused } = this.state;
    const { user, baseUrl, customEmojis, file } = this.props;
    const { description } = file;

    if (!baseUrl) {
      return null;
    }

    return [
      <View key="audio" style={styles.audioContainer}>
        <BorderlessButton
          style={styles.playPauseButton}
          onPress={this.togglePlayPause}
        >
          {paused ? (
            <Icon name={"play"} style={styles.playPauseImage} size={30} />
          ) : (
            <Icon name={"pause"} style={styles.playPauseImage} size={30} />
          )}
        </BorderlessButton>
        <Slider
          style={styles.slider}
          value={Math.round(this.state.playbackInstancePosition / 1000)}
          maximumValue={Math.round(this.state.playbackInstanceDuration / 1000)}
          minimumValue={0}
          animateTransitions
          animationConfig={{
            duration: 250,
            easing: Easing.linear,
            delay: 0
          }}
          thumbTintColor="#1d74f5"
          minimumTrackTintColor="#1d74f5"
          onValueChange={value =>
            this.setState({ playbackInstancePosition: value })
          }
          thumbStyle={styles.thumbStyle}
        />
        <Text style={styles.duration}>{this.getDuration()}</Text>
      </View>,
      <Markdown
        key="description"
        msg={description}
        baseUrl={baseUrl}
        customEmojis={customEmojis}
        username={user.username}
      />
    ];
  }
}
