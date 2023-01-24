import React from 'react';
import { StyleSheet } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import { connect } from 'react-redux';

import RCActivityIndicator from '../containers/ActivityIndicator';
import { IApplicationState, IBaseScreen, IUser } from '../definitions';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

const formatUrl = (url: string, baseUrl: string, uriSize: number, avatarAuthURLFragment: string) =>
	`${baseUrl}/avatar/${url}?format=png&width=${uriSize}&height=${uriSize}${avatarAuthURLFragment}`;

interface IJitsiMeetViewState {
	userInfo: {
		displayName: string;
		avatar: string;
	};
	loading: boolean;
}

interface IJitsiMeetViewProps extends IBaseScreen<ChatsStackParamList, 'JitsiMeetView'> {
	baseUrl: string;
	user: IUser;
}

class JitsiMeetView extends React.Component<IJitsiMeetViewProps, IJitsiMeetViewState> {
	private rid: string;
	private url: string;
	private videoConf: boolean;
	private jitsiTimeout: number | null;

	constructor(props: IJitsiMeetViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.url = props.route.params?.url;
		this.videoConf = !!props.route.params?.videoConf;
		this.jitsiTimeout = null;

		const { user, baseUrl } = props;
		const { name, id: userId, token, username } = user;
		const avatarAuthURLFragment = `&rc_token=${token}&rc_uid=${userId}`;
		const avatar = formatUrl(username, baseUrl, 100, avatarAuthURLFragment);
		this.state = {
			userInfo: {
				displayName: name as string,
				avatar
			},
			loading: true
		};
	}

	componentDidMount() {
		const { route } = this.props;
		const { userInfo } = this.state;

		setTimeout(() => {
			const onlyAudio = route.params?.onlyAudio ?? false;
			if (onlyAudio) {
				JitsiMeet.audioCall(this.url, userInfo);
			} else {
				JitsiMeet.call(this.url, userInfo);
			}
			this.setState({ loading: false });
		}, 1000);
	}

	componentWillUnmount() {
		logEvent(events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout && !this.videoConf) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
			this.jitsiTimeout = null;
			BackgroundTimer.stopBackgroundTimer();
		}
		JitsiMeet.endCall();
	}

	onConferenceWillJoin = () => {
		this.setState({ loading: false });
	};

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		this.setState({ loading: false });
		if (this.rid && !this.videoConf) {
			Services.updateJitsiTimeout(this.rid).catch((e: unknown) => console.log(e));
			if (this.jitsiTimeout) {
				BackgroundTimer.clearInterval(this.jitsiTimeout);
				BackgroundTimer.stopBackgroundTimer();
				this.jitsiTimeout = null;
			}
			this.jitsiTimeout = BackgroundTimer.setInterval(() => {
				Services.updateJitsiTimeout(this.rid).catch((e: unknown) => console.log(e));
			}, 10000);
		}
	};

	onConferenceTerminated = () => {
		const { navigation } = this.props;
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		// fix to go back when the call ends
		setTimeout(() => {
			JitsiMeet.endCall();
			navigation.pop();
		}, 200);
	};

	render() {
		const { loading } = this.state;

		return (
			<>
				<RNJitsiMeetView
					onConferenceWillJoin={this.onConferenceWillJoin}
					onConferenceTerminated={this.onConferenceTerminated}
					onConferenceJoined={this.onConferenceJoined}
					style={StyleSheet.absoluteFill}
					options={null}
				/>
				{loading ? <RCActivityIndicator absolute size='large' /> : null}
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(withTheme(JitsiMeetView));
