import { Alert } from 'react-native';
import { useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

import I18n from '~/i18n';
import dayjs from '~/lib/dayjs';
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
	url.startsWith('user://') || url.startsWith('channel://') || url.startsWith('timestamp://');

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
			if (url.startsWith('user://')) {
				const [rid, query] = url.slice('user://'.length).split('?');
				if (rid === 'all' || rid === 'here' || query === 'team=1') {
					return;
				}
				logEvent(events.ROOM_MENTION_GO_USER_INFO);
				navToRoomInfo?.({ t: 'd', rid, itsMe: query === 'me=1' });
				return;
			}

			if (url.startsWith('channel://')) {
				const rid = url.slice('channel://'.length);
				if (channels?.some(channel => channel._id === rid)) {
					handleChannelPress(rid);
				}
				return;
			}

			if (url.startsWith('timestamp://')) {
				const unixSeconds = Number(url.slice('timestamp://'.length));
				const message = dayjs(unixSeconds * 1000).format('dddd, MMM DD, YYYY hh:mm A');
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
