import React from 'react';
import { StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';

import { getUserSelector } from '../selectors/login';
import ActivityIndicator from '../containers/ActivityIndicator';
import { events, logEvent } from '../utils/log';
import { isAndroid, isIOS } from '../utils/deviceInfo';
import { TSupportedThemes, withTheme } from '../theme';
import { InsideStackParamList } from '../stacks/types';
import { IApplicationState, IUser } from '../definitions';
import { Services } from '../lib/services';

const formatUrl = (url: string, baseUrl: string, uriSize: number, avatarAuthURLFragment: string) =>
	`${baseUrl}/avatar/${url}?format=png&width=${uriSize}&height=${uriSize}${avatarAuthURLFragment}`;

interface IJitsiMeetViewState {
	userInfo: {
		displayName: string;
		avatar: string;
	};
	loading: boolean;
}

interface IJitsiMeetViewProps {
	navigation: StackNavigationProp<InsideStackParamList, 'JitsiMeetView'>;
	route: RouteProp<InsideStackParamList, 'JitsiMeetView'>;
	baseUrl: string;
	theme: TSupportedThemes;
	user: IUser;
}

class JitsiMeetView extends React.Component<IJitsiMeetViewProps, IJitsiMeetViewState> {
	private rid: string;
	private url: string;
	private jitsiTimeout: number | null;

	constructor(props: IJitsiMeetViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.url = props.route.params?.url;
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

		if (isIOS) {
			setTimeout(() => {
				const onlyAudio = route.params?.onlyAudio ?? false;
				if (onlyAudio) {
					JitsiMeet.audioCall(this.url, userInfo);
				} else {
					JitsiMeet.call(this.url, userInfo);
				}
			}, 1000);
		}
	}

	componentWillUnmount() {
		logEvent(events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout) {
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
		logEvent(events.JM_CONFERENCE_JOIN);
		if (this.rid) {
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
		logEvent(events.JM_CONFERENCE_TERMINATE);
		const { navigation } = this.props;
		navigation.pop();
	};

	render() {
		const { userInfo, loading } = this.state;
		const { route } = this.props;
		const onlyAudio = route.params?.onlyAudio ?? false;
		const options = isAndroid ? { url: this.url, userInfo, audioOnly: onlyAudio } : null;
		return (
			<>
				<RNJitsiMeetView
					onConferenceWillJoin={this.onConferenceWillJoin}
					onConferenceTerminated={this.onConferenceTerminated}
					onConferenceJoined={this.onConferenceJoined}
					style={StyleSheet.absoluteFill}
					options={options}
				/>
				{loading ? <ActivityIndicator /> : null}
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(withTheme(JitsiMeetView));
