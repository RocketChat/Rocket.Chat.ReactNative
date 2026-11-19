import { Alert } from 'react-native';
import { useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

import I18n from '~/i18n';
import dayjs from '~/lib/dayjs';
import { CHANNEL_SCHEME, ME_QUERY, TEAM_QUERY, TIMESTAMP_FULL_FORMAT, TIMESTAMP_SCHEME, USER_SCHEME } from '../linkSchemes';
import { useTheme } from '~/theme';
import { LISTENER } from '~/containers/Toast';
import EventEmitter from '~/lib/methods/helpers/events';
import { events, logEvent } from '~/lib/methods/helpers/log';
import openLink from '~/lib/methods/helpers/openLink';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { getRoomInfo } from '~/lib/services/restApi';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { sendLoadingEvent } from '~/containers/Loading';
import { type IUserChannel, type TOnLinkPress } from '../interfaces';

interface IUseMarkdownLinkPressParams {
	channels?: IUserChannel[];
	navToRoomInfo?: Function;
	onLinkPress?: TOnLinkPress;
}

const isInternalScheme = (url: string): boolean =>
	url.startsWith(USER_SCHEME) || url.startsWith(CHANNEL_SCHEME) || url.startsWith(TIMESTAMP_SCHEME);

export const useMarkdownLinkPress = ({ channels, navToRoomInfo, onLinkPress }: IUseMarkdownLinkPressParams) => {
	const { theme } = useTheme();
	const isMasterDetail = useMasterDetail();

	const handleChannelPress = useCallback(
		async (rid: string) => {
			if (!navToRoomInfo) {
				return;
			}
			const navParam = { t: 'c', rid };
			const room = await getSubscriptionByRoomId(rid);
			if (room) {
				goRoom({ item: room, isMasterDetail });
				return;
			}
			sendLoadingEvent({ visible: true });
			try {
				await getRoomInfo(rid);
				sendLoadingEvent({ visible: false });
				navToRoomInfo(navParam);
			} catch (error) {
				sendLoadingEvent({ visible: false });
				showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
			}
		},
		[navToRoomInfo, isMasterDetail]
	);

	const handleLinkPress = useCallback(
		(url: string) => {
			if (url.startsWith(USER_SCHEME)) {
				const [rid, query = ''] = url.slice(USER_SCHEME.length).split('?');
				if (rid === 'all' || rid === 'here' || `?${query}` === TEAM_QUERY) {
					return;
				}
				logEvent(events.ROOM_MENTION_GO_USER_INFO);
				navToRoomInfo?.({ t: 'd', rid, itsMe: `?${query}` === ME_QUERY });
				return;
			}

			if (url.startsWith(CHANNEL_SCHEME)) {
				const rid = url.slice(CHANNEL_SCHEME.length);
				if (channels?.some(channel => channel._id === rid)) {
					handleChannelPress(rid);
				}
				return;
			}

			if (url.startsWith(TIMESTAMP_SCHEME)) {
				const unixSeconds = Number(url.slice(TIMESTAMP_SCHEME.length));
				const message = dayjs(unixSeconds * 1000).format(TIMESTAMP_FULL_FORMAT);
				EventEmitter.emit(LISTENER, { message });
				return;
			}

			if (process.env.RUNNING_E2E_TESTS === 'true') {
				Alert.alert('Link Pressed', url);
				return;
			}

			if (onLinkPress) {
				onLinkPress(url);
				return;
			}

			openLink(url, theme);
		},
		[channels, navToRoomInfo, onLinkPress, theme, handleChannelPress]
	);

	const handleLinkLongPress = useCallback((url: string) => {
		if (isInternalScheme(url)) {
			return;
		}

		if (process.env.RUNNING_E2E_TESTS === 'true') {
			Alert.alert('Link Long Pressed', url);
			return;
		}

		Clipboard.setString(url);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	}, []);

	return { handleLinkPress, handleLinkLongPress };
};
