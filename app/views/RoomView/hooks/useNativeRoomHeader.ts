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
import { headerTextIcon } from '~/lib/methods/helpers/navigation/headerIcon';
import { useTheme } from '~/theme';
import { type IRoomViewProps } from '../definitions';
import { type IHeaderFields } from './useHeaderFields';
import { useHeaderRemoteImage } from './useHeaderImage';

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
	activeUser
}: {
	fields: IHeaderFields;
	tmid?: string;
	usersTyping: string[];
	activeUser?: IActiveUser;
}) => {
	if (tmid) {
		return fields.parentTitle;
	}
	if (usersTyping.length) {
		return `${joinTypingUsers(usersTyping)} ${I18n.t(usersTyping.length > 1 ? 'are_typing' : 'is_typing')}...`;
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
	const connectionSubtitle = getConnectionSubtitle({ connecting, connected });
	const typing = !tmid && usersTyping.length > 0;
	const subtitle = connectionSubtitle ?? getSubtitle({ fields, tmid, usersTyping, activeUser });
	const plainTitle = usePreviewFormatText(fields.title ?? '');
	const formattedSubtitle = usePreviewFormatText(subtitle ?? '');
	const hasStatusExpiry = fields.type === 'd' && connected && !!formatStatusExpiry(activeUser?.statusExpiresAt);
	const showsRoomSubtitle = !connectionSubtitle && !tmid && !typing;
	return {
		title: tmid || fields.prid ? plainTitle : fields.title,
		subtitle: showsRoomSubtitle ? formattedSubtitle : subtitle,
		showClock: showsRoomSubtitle && !!subtitle && hasStatusExpiry,
		showParentIcon: !connectionSubtitle && !!tmid
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

	const { title, subtitle, showClock, showParentIcon } = useRoomHeaderContent(fields, tmid, activeUser, connected);

	const roomIcon = getRoomIcon(fields, isDirectMessage, status);
	const roomIconColor = isDirectMessage || fields.type === 'l' ? statusColor : colors.fontTitlesLabels;
	const server = useAppSelector(state => state.server.server);
	const isSvgSidebarIcon = fields.sourceType?.sidebarIcon?.toLowerCase().endsWith('.svg');
	const remoteUri =
		connected && fields.type === 'l' && !isSvgSidebarIcon ? getOmnichannelSidebarIconUri(server, fields.sourceType) : undefined;
	const remoteImage = useHeaderRemoteImage(remoteUri);

	useLayoutEffect(() => {
		const roomGlyph = fields.type ? headerTextIcon(roomIcon, roomIconColor) : undefined;
		const roomTitleIcon = remoteImage ? { type: 'image' as const, source: remoteImage } : roomGlyph;
		const clockIcon = showClock ? headerTextIcon('clock', colors.fontSecondaryInfo) : undefined;
		navigation.setOptions({
			headerTitle: title,
			headerSubtitle: subtitle || undefined,
			headerTitleIcon: tmid ? undefined : roomTitleIcon,
			headerSubtitleIcon: showParentIcon ? roomTitleIcon : clockIcon,
			headerTitleTestID: 'room-header',
			onHeaderTitlePress: fields.disabled ? undefined : () => onTitlePress()
		});
	}, [
		navigation,
		title,
		subtitle,
		tmid,
		fields.type,
		roomIcon,
		roomIconColor,
		remoteImage,
		showClock,
		colors.fontSecondaryInfo,
		showParentIcon,
		onTitlePress,
		fields.disabled
	]);
};
