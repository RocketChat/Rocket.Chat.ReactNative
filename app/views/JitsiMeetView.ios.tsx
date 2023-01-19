// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import JitsiMeet from '@socialcode-rob1/react-native-jitsimeet-custom';
import React, { useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import RCActivityIndicator from '../containers/ActivityIndicator';
import { useAppSelector } from '../lib/hooks';
import { events, logEvent } from '../lib/methods/helpers/log';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';

const formatUrl = (url: string, baseUrl: string, uriSize: number, avatarAuthURLFragment: string) =>
	`${baseUrl}/avatar/${url}?format=png&width=${uriSize}&height=${uriSize}${avatarAuthURLFragment}`;

const JitsiMeetView = (): React.ReactElement => {
	const { goBack } = useNavigation();
	const {
		params: { url, onlyAudio, videoConf }
	} = useRoute<RouteProp<ChatsStackParamList, 'JitsiMeetView'>>();
	const user = useAppSelector(state => getUserSelector(state));
	const baseUrl = useAppSelector(state => state.server.server);

	useEffect(() => {
		initJitsi();
	}, []);

	const initJitsi = async () => {
		const audioOnly = onlyAudio ?? false;
		const { name, id: userId, token, username } = user;
		const avatarAuthURLFragment = `&rc_token=${token}&rc_uid=${userId}`;
		const avatar = formatUrl(username, baseUrl, 100, avatarAuthURLFragment);

		const userInfo = {
			displayName: name as string,
			avatar
		};
		const regex = /(?:\/.*\/)(.*)/;
		const urlWithoutServer = regex.exec(url)![1];
		const serverUrl = url.replace(`/${urlWithoutServer}`, '');
		const room = urlWithoutServer.split('#')[0];

		const conferenceOptions = {
			room,
			serverUrl,
			userInfo: {
				displayName: userInfo.displayName,
				avatar: userInfo.avatar
			},
			subject: room,
			audioOnly,
			audioMuted: false,
			videoMuted: audioOnly,
			featureFlags: {
				'live-streaming.enabled': false,
				'calendar.enabled': false,
				'call-integration.enabled': false,
				'pip.enabled': false,
				'invite.enabled': false,
				'welcomepage.enabled': false,
				'add-people.enabled': false
			},
			configOverrides: {
				'breakoutRooms.hideAddRoomButton': false,
				'breakoutRooms.hideAutoAssignButton': false,
				'breakoutRooms.hideJoinRoomButton': false
			}
		};
		logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		await JitsiMeet.launchJitsiMeetView(conferenceOptions);
		logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		goBack();
	};

	return <RCActivityIndicator absolute size='large' />;
};

export default JitsiMeetView;
