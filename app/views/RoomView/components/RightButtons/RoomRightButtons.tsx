import { type ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '../../../../containers/Header/components/HeaderButton';
import { type ISubscription, type SubscriptionType, type TUserStatus } from '../../../../definitions';
import i18n from '../../../../i18n';
import { getRoomTitle, isGroupChat } from '../../../../lib/methods/helpers';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import getRoomAccessibilityLabel from '../../../../lib/helpers/getRoomAccessibilityLabel';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../../../lib/hooks/useMasterDetail';
import { usePermissions } from '../../../../lib/hooks/usePermissions';
import { useSetting } from '../../../../lib/hooks/useSetting';
import { getUserSelector } from '../../../../selectors/login';
import { useTheme } from '../../../../theme';
import { type RoomStore } from '../../definitions';
import { useRoomFromStore } from '../../stores/RoomStoreContext';
import { useE2EEStatus } from '../../hooks/useE2EEStatus';
import { useSubscriptionUnreads } from '../../hooks/useSubscriptionUnreads';
import { navigateToScreen, type TRoomStackNavigation } from '../../services/navigateToScreen';
import { getRoomHeaderFields } from '../../services/getRoomHeaderFields';
import { HeaderCallButton } from './HeaderCallButton';

interface IRoomRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const RoomRightButtons = ({ rid, roomStore }: IRoomRightButtonsProps): ReactElement => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();

	const userId = useAppSelector(state => getUserSelector(state).id);
	const threadsEnabled = useSetting('Threads_enabled') as boolean;
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);

	const { room } = useRoomFromStore(roomStore);
	const { hasE2EEWarning } = useE2EEStatus(roomStore);
	const { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription } = useSubscriptionUnreads(roomStore, userId);
	const [canToggleEncryption] = usePermissions(['toggle-room-e2e-encryption'], rid);

	const t = room.t as SubscriptionType;
	const { status } = room;
	const roomName = getRoomTitle(room);
	const roomIsGroupChat = isGroupChat(room as ISubscription);
	const { teamMain, encrypted } = getRoomHeaderFields(room);

	const goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		navigateToScreen({ navigation, isMasterDetail, screen: 'ThreadMessagesView', params: { rid, t } });
	};

	const navigateToNotificationOrPushTroubleshoot = () => {
		if (!subscription) {
			return;
		}
		if (!issuesWithNotifications) {
			navigateToScreen({ navigation, isMasterDetail, screen: 'NotificationPrefView', params: { rid, room: subscription } });
		} else {
			navigateToScreen({ navigation, isMasterDetail, screen: 'PushTroubleshootView' });
		}
	};

	const goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		navigateToScreen({
			navigation,
			isMasterDetail,
			screen: 'SearchMessagesView',
			params: isMasterDetail ? { rid, t, encrypted, showCloseModal: true } : { rid, t, encrypted }
		});
	};

	const goE2EEToggleRoomView = () => {
		logEvent(events.ROOM_GO_E2EE);
		navigateToScreen({ navigation, isMasterDetail, screen: 'E2EEToggleRoomView', params: { rid } });
	};

	const threadsAccessibilityLabel = () => {
		if (!tunread.length) {
			return i18n.t('Threads');
		}
		if (tunreadUser?.length) {
			return i18n.t('Threads_dm_unread', { unread: tunreadUser?.length });
		}
		if (tunreadGroup?.length) {
			return i18n.t('Threads_group_unread', { unread: tunreadGroup?.length });
		}
		return i18n.t('Threads_unread', { unread: tunread?.length });
	};

	const accessibilityRoomName =
		!roomIsGroupChat && t === 'd' && !!userId
			? roomName
			: getRoomAccessibilityLabel({ type: t, userId, isGroupChat: roomIsGroupChat, status: status as TUserStatus, teamMain });

	return (
		<HeaderButton.Container>
			{hasE2EEWarning ? (
				<HeaderButton.Item
					iconName='encrypted'
					onPress={goE2EEToggleRoomView}
					disabled={!canToggleEncryption}
					testID='room-view-header-encryption'
				/>
			) : null}
			{issuesWithNotifications || (room as ISubscription).disableNotifications ? (
				<HeaderButton.Item
					color={issuesWithNotifications ? colors.fontDanger : ''}
					iconName='notification-disabled'
					onPress={navigateToNotificationOrPushTroubleshoot}
					testID='room-view-push-troubleshoot'
					disabled={hasE2EEWarning}
				/>
			) : null}
			{!isSelfDm ? (
				<HeaderCallButton
					accessibilityLabel={i18n.t('Call_room_name', { roomName: accessibilityRoomName })}
					rid={rid}
					disabled={hasE2EEWarning}
				/>
			) : null}
			{threadsEnabled ? (
				<HeaderButton.Item
					accessibilityLabel={threadsAccessibilityLabel()}
					iconName='threads'
					onPress={goThreadsView}
					testID='room-view-header-threads'
					badge={() => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />}
					disabled={hasE2EEWarning}
				/>
			) : null}
			<HeaderButton.Item
				accessibilityLabel={i18n.t('Search_Messages')}
				iconName='search'
				onPress={goSearchView}
				testID='room-view-search'
				disabled={hasE2EEWarning}
			/>
		</HeaderButton.Container>
	);
};
