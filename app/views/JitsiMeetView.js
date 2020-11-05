import React from 'react';
import PropTypes from 'prop-types';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';

import RocketChat from '../lib/rocketchat';
import { getUserSelector } from '../selectors/login';

import sharedStyles from './Styles';
import { logEvent, events } from '../utils/log';

const formatUrl = (url, baseUrl, uriSize, avatarAuthURLFragment) => (
	`${ baseUrl }/avatar/${ url }?format=png&width=${ uriSize }&height=${ uriSize }${ avatarAuthURLFragment }`
);

class JitsiMeetView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			name: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
		this.onConferenceTerminated = this.onConferenceTerminated.bind(this);
		this.onConferenceJoined = this.onConferenceJoined.bind(this);
		this.jitsiTimeout = null;
	}

	componentDidMount() {
		const { route, user, baseUrl } = this.props;
		const {
			name: displayName, id: userId, token, username
		} = user;

		const avatarAuthURLFragment = `&rc_token=${ token }&rc_uid=${ userId }`;
		const avatar = formatUrl(username, baseUrl, 100, avatarAuthURLFragment);

		setTimeout(() => {
			const userInfo = {
				displayName,
				avatar
			};
			const url = route.params?.url;
			const onlyAudio = route.params?.onlyAudio ?? false;
			if (onlyAudio) {
				JitsiMeet.audioCall(url, userInfo);
			} else {
				JitsiMeet.call(url, userInfo);
			}
		}, 1000);
	}

	componentWillUnmount() {
		logEvent(events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
		}
		JitsiMeet.endCall();
	}

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		logEvent(events.JM_CONFERENCE_JOIN);
		RocketChat.updateJitsiTimeout(this.rid).catch(e => console.log(e));
		if (this.jitsiTimeout) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
		}
		this.jitsiTimeout = BackgroundTimer.setInterval(() => {
			RocketChat.updateJitsiTimeout(this.rid).catch(e => console.log(e));
		}, 10000);
	}

	onConferenceTerminated = () => {
		logEvent(events.JM_CONFERENCE_TERMINATE);
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

const mapStateToProps = state => ({
	user: getUserSelector(state),
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(JitsiMeetView);
