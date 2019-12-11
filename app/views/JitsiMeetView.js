import React from 'react';
import PropTypes from 'prop-types';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import BackgroundTimer from 'react-native-background-timer';

import RocketChat from '../lib/rocketchat';

import sharedStyles from './Styles';

class JitsiMeetView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
		this.onConferenceTerminated = this.onConferenceTerminated.bind(this);
		this.onConferenceJoined = this.onConferenceJoined.bind(this);
		this.jitsiTimeout = null;
	}

	componentDidMount() {
		const { navigation } = this.props;
		setTimeout(() => {
			const url = navigation.getParam('url');
			const onlyAudio = navigation.getParam('onlyAudio', false);
			if (onlyAudio) {
				JitsiMeet.audioCall(url);
			} else {
				JitsiMeet.call(url);
			}
		}, 1000);
	}

	componentWillUnmount() {
		if (this.jitsiTimeout) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
		}
		JitsiMeet.endCall();
	}

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		RocketChat.updateJitsiTimeout(this.rid).catch(e => console.log(e));
		if (this.jitsiTimeout) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
		}
		this.jitsiTimeout = BackgroundTimer.setInterval(() => {
			RocketChat.updateJitsiTimeout(this.rid).catch(e => console.log(e));
		}, 10000);
	}

	onConferenceTerminated = () => {
		const { navigation } = this.props;
		if (this.jitsiTimeout) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
		}
		navigation.pop();
	}

	render() {
		return (
			<RNJitsiMeetView
				onConferenceTerminated={this.onConferenceTerminated}
				onConferenceJoined={this.onConferenceJoined}
				style={sharedStyles.container}
			/>
		);
	}
}

export default JitsiMeetView;
