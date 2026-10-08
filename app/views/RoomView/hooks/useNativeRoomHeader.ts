import { useEffect, useLayoutEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { type TIconsName } from '~/containers/CustomIcon';
import { getStatusIconName } from '~/containers/Status/getStatusIconName';
import {
	getOmnichannelIconName,
	getOmnichannelSidebarIconUri,
	getRoomTypeIconName
} from '~/containers/RoomTypeIcon/roomTypeIconName';
import { getConnectionSubtitle, getPresenceLabel, joinTypingUsers } from '~/containers/RoomHeader/subtitle';
import { type TUserStatus } from '~/definitions';
import { type IActiveUser } from '~/reducers/activeUsers';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import usePreviewFormatText from '~/lib/hooks/usePreviewFormatText';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { getUserPresence } from '~/lib/methods/getUsersPresence';
import { formatStatusExpiry } from '~/lib/methods/helpers/formatStatusExpiry';
import { useTheme } from '~/theme';
import { type IRoomViewProps } from '../definitions';
import { type IHeaderFields } from './useHeaderFields';
import { useHeaderIconImage, useHeaderRemoteImage } from './useHeaderImage';

const TITLE_FONT_SIZE = 17;
const SUBTITLE_FONT_SIZE = 12;

const getRoomIcon = (fields: IHeaderFields, isDirectMessage: boolean, status: TUserStatus): TIconsName => {
	if (isDirectMessage) {
		return getStatusIconName(status);
	}
	if (fields.type === 'l' && !fields.prid) {
		return getOmnichannelIconName(fields.sourceType);
	}
	return getRoomTypeIconName({
		type: fields.type,
		teamMain: fields.teamMain,
		isDiscussion: !!fields.prid,
		isGroupChat: fields.isGroupChat,
		abacAttributes: fields.abacAttributes
	});
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
		return `${joinTypingUsers(usersTyping)} ${I18n.t(usersTyping.length > 1 ? 'are_typing' : 'is_typing')}...`;
	}
	const connectionSubtitle = getConnectionSubtitle({ connecting, connected });
	if (connectionSubtitle) {
		return connectionSubtitle;
	}
	if (fields.type === 'd') {
		return activeUser ? getPresenceLabel(activeUser) : undefined;
	}
	return fields.subtitle;
};

const useRoomHeaderPresence = (fields: IHeaderFields, roomUserId?: string | null) => {
	const connected = useAppSelector(state => state.meteor.connected);
	const presenceDisabled = useAppSelector(state => state.settings.Presence_broadcast_disabled);
	const activeUser = useAppSelector(state => (roomUserId ? state.activeUsers[roomUserId] : undefined), shallowEqual);
	const isDirectMessage = fields.type === 'd' && !fields.isGroupChat && !!roomUserId && !fields.prid;
	const status: TUserStatus = presenceDisabled ? 'disabled' : !connected ? 'offline' : (activeUser?.status ?? 'loading');
	const visitorStatus = connected ? fields.visitor?.status : undefined;
	const statusColor = useUserStatusColor(fields.type === 'l' ? (visitorStatus ?? 'offline') : status);

	useEffect(() => {
		if (isDirectMessage && connected && status === 'loading' && roomUserId) {
			getUserPresence(roomUserId);
		}
	}, [isDirectMessage, connected, status, roomUserId]);

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
	fields: IHeaderFields,
	tmid: string | undefined,
	roomUserId: string | null | undefined,
	onTitlePress: () => void
) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const { colors } = useTheme();
	const { connected, activeUser, isDirectMessage, status, statusColor } = useRoomHeaderPresence(fields, roomUserId);

	const { title, subtitle, showClock } = useRoomHeaderContent(fields, tmid, activeUser, connected);

	const roomIcon = getRoomIcon(fields, isDirectMessage, status);
	const glyphImage = useHeaderIconImage(
		fields.type ? roomIcon : undefined,
		isDirectMessage || fields.type === 'l' ? statusColor : colors.fontTitlesLabels,
		TITLE_FONT_SIZE
	);
	const server = useAppSelector(state => state.server.server);
	const remoteUri = connected && fields.type === 'l' ? getOmnichannelSidebarIconUri(server, fields.sourceType) : undefined;
	const remoteImage = useHeaderRemoteImage(remoteUri);
	const roomImage = remoteImage ?? glyphImage;
	const clockImage = useHeaderIconImage(showClock ? 'clock' : undefined, colors.fontSecondaryInfo, SUBTITLE_FONT_SIZE);
	const subtitleImage = tmid ? roomImage : clockImage;

	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: title,
			headerSubtitle: subtitle || undefined,
			headerTitleImageSource: tmid ? undefined : roomImage,
			headerSubtitleImageSource: subtitleImage,
			headerTitleStyle: { color: colors.fontTitlesLabels },
			headerSubtitleColor: colors.fontSecondaryInfo,
			headerTitleTestID: 'room-header',
			onHeaderTitlePress: fields.disabled ? undefined : () => onTitlePress()
		});
	}, [navigation, title, subtitle, tmid, roomImage, subtitleImage, colors, onTitlePress, fields.disabled]);
};
