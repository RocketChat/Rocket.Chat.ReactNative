import { useEffect, useLayoutEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { hasIcon, type TIconsName } from '~/containers/CustomIcon';
import { STATUS_I18N_KEYS, type TUserStatus } from '~/definitions';
import { type IActiveUser } from '~/reducers/activeUsers';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import usePreviewFormatText from '~/lib/hooks/usePreviewFormatText';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { getUserPresence } from '~/lib/methods/getUsersPresence';
import { formatStatusExpiry } from '~/lib/methods/helpers/formatStatusExpiry';
import { useTheme } from '~/theme';
import { type IRoomViewProps } from '../definitions';
import { type IHeaderFields } from './useHeader';
import { useHeaderIconImage, useHeaderRemoteImage } from './useHeaderImage';

const TITLE_FONT_SIZE = 17;
const SUBTITLE_FONT_SIZE = 12;

const sourceIcons: Record<string, TIconsName> = {
	widget: 'livechat-monochromatic',
	email: 'mail',
	sms: 'sms',
	app: 'omnichannel',
	api: 'omnichannel',
	other: 'omnichannel'
};

const getRoomIcon = (fields: IHeaderFields, isDirectMessage: boolean, status: TUserStatus): TIconsName => {
	let roomIcon: TIconsName = 'channel-private';
	if (isDirectMessage) {
		const statusIcon = `status-${status}`;
		roomIcon = hasIcon(statusIcon) ? (statusIcon as TIconsName) : 'status-offline';
	} else if (fields.type === 'l' && !fields.prid) {
		roomIcon = sourceIcons[fields.sourceType?.type ?? 'other'] ?? 'omnichannel';
	} else if (fields.abacAttributes?.length) {
		roomIcon = fields.teamMain ? 'team-shield' : 'hash-shield';
	} else if (fields.teamMain) {
		roomIcon = fields.type === 'p' ? 'teams-private' : 'teams';
	} else if (fields.prid) {
		roomIcon = 'discussions';
	} else if (fields.type === 'c') {
		roomIcon = 'channel-public';
	} else if (fields.type === 'd' && fields.isGroupChat) {
		roomIcon = 'message';
	}
	return roomIcon;
};

const getSubtitle = ({
	fields,
	tmid,
	usersTyping,
	connected,
	connecting,
	activeUser
}: {
	fields: IHeaderFields;
	tmid?: string;
	usersTyping: string[];
	connected: boolean;
	connecting: boolean;
	activeUser?: IActiveUser;
}) => {
	if (tmid) {
		return fields.parentTitle;
	}
	if (usersTyping.length) {
		const names = usersTyping.join(usersTyping.length === 2 ? ` ${I18n.t('and')} ` : ', ');
		return `${names} ${I18n.t(usersTyping.length > 1 ? 'are_typing' : 'is_typing')}...`;
	}
	if (fields.type === 'd') {
		if (!connected || !activeUser) {
			return undefined;
		}
		const presenceKey = STATUS_I18N_KEYS[activeUser.status];
		return activeUser.statusText || (presenceKey ? I18n.t(presenceKey) : undefined);
	}
	if (connecting) {
		return I18n.t('Connecting');
	}
	return connected ? fields.subtitle : I18n.t('Waiting_for_network');
};

const useRoomHeaderPresence = (enabled: boolean, fields: IHeaderFields, roomUserId?: string | null) => {
	const connected = useAppSelector(state => state.meteor.connected);
	const presenceDisabled = useAppSelector(state => state.settings.Presence_broadcast_disabled);
	const activeUser = useAppSelector(state => (roomUserId ? state.activeUsers[roomUserId] : undefined), shallowEqual);
	const isDirectMessage = fields.type === 'd' && !fields.isGroupChat && !!roomUserId && !fields.prid;
	const status: TUserStatus = presenceDisabled ? 'disabled' : !connected ? 'offline' : (activeUser?.status ?? 'loading');
	const visitorStatus = connected ? fields.visitor?.status : undefined;
	const statusColor = useUserStatusColor(fields.type === 'l' ? (visitorStatus ?? 'offline') : status);

	useEffect(() => {
		if (enabled && isDirectMessage && connected && status === 'loading' && roomUserId) {
			getUserPresence(roomUserId);
		}
	}, [enabled, isDirectMessage, connected, status, roomUserId]);

	return { connected, activeUser, isDirectMessage, status, statusColor };
};

const useRoomHeaderContent = (
	fields: IHeaderFields,
	tmid: string | undefined,
	activeUser: IActiveUser | undefined,
	connected: boolean
) => {
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading);
	const usersTyping = useAppSelector(state => state.usersTyping, shallowEqual);
	const typing = !tmid && usersTyping.length > 0;
	const subtitle = getSubtitle({ fields, tmid, usersTyping, connected, connecting, activeUser });
	const plainTitle = usePreviewFormatText(fields.title ?? '');
	const formattedSubtitle = usePreviewFormatText(subtitle ?? '');
	const hasStatusExpiry = fields.type === 'd' && connected && !!formatStatusExpiry(activeUser?.statusExpiresAt);
	return {
		title: tmid || fields.prid ? plainTitle : fields.title,
		subtitle: tmid || typing ? subtitle : formattedSubtitle,
		showClock: !tmid && !typing && !!subtitle && hasStatusExpiry
	};
};

export const useNativeRoomHeader = (
	enabled: boolean,
	fields: IHeaderFields,
	tmid?: string,
	roomUserId?: string | null,
	onTitlePress?: () => void
) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const { colors } = useTheme();
	const { connected, activeUser, isDirectMessage, status, statusColor } = useRoomHeaderPresence(enabled, fields, roomUserId);

	const { title, subtitle, showClock } = useRoomHeaderContent(fields, tmid, activeUser, connected);

	const roomIcon = getRoomIcon(fields, isDirectMessage, status);
	const glyphImage = useHeaderIconImage(
		enabled && fields.type ? roomIcon : undefined,
		isDirectMessage || fields.type === 'l' ? statusColor : colors.fontTitlesLabels,
		TITLE_FONT_SIZE
	);
	const server = useAppSelector(state => state.server.server);
	const source = fields.sourceType;
	const remoteUri =
		enabled && connected && fields.type === 'l' && source?.type === 'app' && source.id && source.sidebarIcon
			? `${server}/api/apps/public/${source.id}/get-sidebar-icon?icon=${source.sidebarIcon}`
			: undefined;
	const remoteImage = useHeaderRemoteImage(remoteUri);
	const roomImage = remoteImage ?? glyphImage;
	const clockImage = useHeaderIconImage(enabled && showClock ? 'clock' : undefined, colors.fontSecondaryInfo, SUBTITLE_FONT_SIZE);
	const subtitleImage = tmid ? roomImage : clockImage;

	useLayoutEffect(() => {
		if (enabled) {
			navigation.setOptions({
				headerTitle: title,
				headerSubtitle: subtitle || undefined,
				headerTitleImageSource: tmid ? undefined : roomImage,
				headerSubtitleImageSource: subtitleImage,
				headerTitleStyle: { color: colors.fontTitlesLabels },
				headerSubtitleColor: colors.fontSecondaryInfo,
				onHeaderTitlePress: onTitlePress && !fields.disabled ? () => onTitlePress() : undefined
			});
		}
	}, [enabled, navigation, title, subtitle, tmid, roomImage, subtitleImage, colors, onTitlePress, fields.disabled]);
};
