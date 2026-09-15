import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import { type ISubscription, type SubscriptionType, type TSubscriptionModel, type TUserStatus } from '~/definitions';
import i18n from '~/i18n';
import { getRoomTitle, isGroupChat, isIOS } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import getRoomAccessibilityLabel from '~/lib/helpers/getRoomAccessibilityLabel';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useSetting } from '~/lib/hooks/useSetting';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import { type RoomStore } from '~/views/RoomView/definitions';
import { isSubscriptionModel } from '~/definitions/TRoom';
import { fromSubscription } from '~/views/RoomView/stores/RoomStoreContext';
import { useE2EEStatus } from '~/views/RoomView/hooks/useE2EEStatus';
import { useSubscriptionUnreads } from '~/views/RoomView/hooks/useSubscriptionUnreads';
import { navigateToScreen, type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';
import { ApplyRoomHeaderItems, RoomHeaderItemsWithCall } from './ApplyRoomHeaderItems';
import { type HeaderAction } from '~/lib/methods/helpers/navigation';
import { getUnreadStyle } from '~/containers/UnreadBadge/getUnreadStyle';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';

interface IRoomRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const RoomRightButtons = ({ rid, roomStore }: IRoomRightButtonsProps): ReactElement => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const { colors, theme } = useTheme();
	const onRoomInfoPress = useGoRoomActionsView(roomStore);

	const userId = useAppSelector(state => getUserSelector(state).id);
	const threadsEnabled = useSetting('Threads_enabled') as boolean;
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);

	const { t, status, roomName, roomIsGroupChat, teamMain, encrypted, disableNotifications } = useStore(
		roomStore,
		useShallow(s => {
			const room = s.room;
			return {
				t: room.t as SubscriptionType,
				status: fromSubscription(r => r.status, undefined)(s),
				roomName: getRoomTitle(room),
				roomIsGroupChat: isGroupChat(room as ISubscription),
				teamMain: fromSubscription(r => !!r.teamMain, false)(s),
				encrypted: fromSubscription(r => r.encrypted, undefined)(s),
				disableNotifications: (room as ISubscription).disableNotifications
			};
		})
	);
	const { hasE2EEWarning } = useE2EEStatus(roomStore);
	const { tunread, tunreadUser, tunreadGroup, isSelfDm } = useSubscriptionUnreads(roomStore, userId);
	const [canToggleEncryption] = usePermissions(['toggle-room-e2e-encryption'], rid);

	const goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		navigateToScreen({ navigation, isMasterDetail, screen: 'ThreadMessagesView', params: { rid, t } });
	};

	const navigateToNotificationOrPushTroubleshoot = () => {
		const room = roomStore.getState().room;
		if (!isSubscriptionModel(room)) {
			return;
		}
		if (!issuesWithNotifications) {
			navigateToScreen({
				navigation,
				isMasterDetail,
				screen: 'NotificationPrefView',
				params: { rid, room: room as TSubscriptionModel }
			});
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

	const beforeCall: HeaderAction[] = isIOS
		? [{ type: 'button', label: i18n.t('Room_Info'), iconName: 'info', onPress: onRoomInfoPress }]
		: [];
	const afterCall: HeaderAction[] = [];
	if (hasE2EEWarning) {
		beforeCall.push({
			type: 'button',
			label: i18n.t('E2E_Encryption'),
			iconName: 'encrypted',
			onPress: goE2EEToggleRoomView,
			disabled: !canToggleEncryption,
			testID: 'room-view-header-encryption'
		});
	}
	if (issuesWithNotifications || disableNotifications) {
		beforeCall.push({
			type: 'button',
			label: i18n.t('Notifications'),
			iconName: 'notification-disabled',
			tintColor: issuesWithNotifications ? colors.fontDanger : undefined,
			onPress: navigateToNotificationOrPushTroubleshoot,
			disabled: hasE2EEWarning,
			testID: 'room-view-push-troubleshoot'
		});
	}
	if (threadsEnabled) {
		const badge = () => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />;
		afterCall.push({
			type: 'button',
			label: threadsAccessibilityLabel(),
			iconName: 'threads',
			onPress: goThreadsView,
			disabled: hasE2EEWarning,
			testID: 'room-view-header-threads',
			androidBadge: badge,
			badge: tunread.length
				? {
						value: tunread.length >= 100 ? '+99' : tunread.length,
						style: getUnreadStyle({ theme, tunread, tunreadUser, tunreadGroup })
					}
				: undefined
		});
	}
	afterCall.push({
		type: 'button',
		label: i18n.t('Search_Messages'),
		iconName: 'search',
		onPress: goSearchView,
		testID: 'room-view-search',
		disabled: hasE2EEWarning
	});
	if (isSelfDm) {
		return <ApplyRoomHeaderItems navigation={navigation} actions={[...beforeCall, ...afterCall]} />;
	}
	return (
		<RoomHeaderItemsWithCall
			navigation={navigation}
			beforeCall={beforeCall}
			afterCall={afterCall}
			rid={rid}
			disabled={hasE2EEWarning}
			accessibilityLabel={i18n.t('Call_room_name', { roomName: accessibilityRoomName })}
		/>
	);
};
