import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useNavigation } from '@react-navigation/native';

import { type ISubscription, type SubscriptionType, type TSubscriptionModel, type TUserStatus } from '~/definitions';
import { isSubscriptionModel } from '~/definitions/TRoom';
import i18n from '~/i18n';
import getRoomAccessibilityLabel from '~/lib/helpers/getRoomAccessibilityLabel';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useSetting } from '~/lib/hooks/useSetting';
import { getRoomTitle, isGroupChat } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import { type RoomStore } from '~/views/RoomView/definitions';
import { useE2EEStatus } from '~/views/RoomView/hooks/useE2EEStatus';
import { useSubscriptionUnreads } from '~/views/RoomView/hooks/useSubscriptionUnreads';
import { fromSubscription } from '~/views/RoomView/stores/RoomStoreContext';
import { navigateToScreen, type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';

export const useRoomRightButtonsData = (rid: string, roomStore: RoomStore) => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();

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
	const callAccessibilityLabel = i18n.t('Call_room_name', { roomName: accessibilityRoomName });

	return {
		colors,
		threadsEnabled,
		issuesWithNotifications,
		disableNotifications,
		hasE2EEWarning,
		canToggleEncryption,
		isSelfDm,
		tunread,
		tunreadUser,
		tunreadGroup,
		callAccessibilityLabel,
		goThreadsView,
		navigateToNotificationOrPushTroubleshoot,
		goSearchView,
		goE2EEToggleRoomView,
		threadsAccessibilityLabel: threadsAccessibilityLabel()
	};
};
