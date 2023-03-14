import React, { useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import JitsiMeet from 'react-native-jitsi';

import RCActivityIndicator from '../containers/ActivityIndicator';
import { useAppSelector } from '../lib/hooks';
import { events, logEvent } from '../lib/methods/helpers/log';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { endVideoConfTimer, initVideoConfTimer } from '../lib/methods/videoConfTimer';

const formatUrl = (url: string, baseUrl: string, uriSize: number, avatarAuthURLFragment: string) =>
	`${baseUrl}/avatar/${url}?format=png&width=${uriSize}&height=${uriSize}${avatarAuthURLFragment}`;

const JitsiMeetView = (): React.ReactElement => {
	const { goBack } = useNavigation();
	const {
		params: { url, videoConf, rid }
	} = useRoute<RouteProp<ChatsStackParamList, 'JitsiMeetView'>>();
	const user = useAppSelector(state => getUserSelector(state));
	const baseUrl = useAppSelector(state => state.server.server);

	useEffect(() => {
		initJitsi();
	}, []);

	const initJitsi = async () => {
		const { name, id: userId, token, username } = user;
		const avatarAuthURLFragment = `&rc_token=${token}&rc_uid=${userId}`;
		const avatar = formatUrl(username, baseUrl, 100, avatarAuthURLFragment);
		const conferenceOptions = {
			url,
			userInfo: {
				displayName: name as string,
				avatar
			}
		};
		if (!videoConf) initVideoConfTimer(rid);
		logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		await JitsiMeet.launch(conferenceOptions);
		if (!videoConf) endVideoConfTimer();
		logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		goBack();
	};

	return <RCActivityIndicator absolute size='large' />;
};

export default JitsiMeetView;
