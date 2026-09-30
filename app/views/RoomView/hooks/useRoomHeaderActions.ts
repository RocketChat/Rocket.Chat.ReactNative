import { useNavigation } from '@react-navigation/native';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '~/ee/omnichannel/hooks/useCanReturnQueue';
import { useSetting } from '~/lib/hooks/useSetting';
import { hasNativeHeaderBar, showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type IHeaderAction, type IHeaderMenuItem } from '~/lib/methods/helpers/navigation/headerActions';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { returnLivechat } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import { getUnreadStyle } from '~/containers/UnreadBadge/getUnreadStyle';
import { type RoomStore } from '../definitions';
import { fromSubscription } from '../stores/RoomStoreContext';
import { closeLivechat } from '../services/closeLivechat';
import { placeLivechatOnHold } from '../services/placeLivechatOnHold';
import { navigateToScreen, type TRoomStackNavigation } from '../services/navigateToScreen';
import { getRoomHeaderMode } from '../helpers/getRoomHeaderMode';
import { splitRoomHeaderActions, type TRoomHeaderActionKey } from '../helpers/roomHeaderActions';
import { useCanPlaceLivechatOnHold } from './useCanPlaceLivechatOnHold';
import { useThreadFollowing } from './useThreadFollowing';
import { useRoomRightButtonsData } from '../components/RightButtons/useRoomRightButtonsData';
import { useHeaderCallPress } from '../components/RightButtons/useHeaderCallPress';

const EMPTY_ACTIONS: IHeaderAction[] = [];
const VISIBLE_ORDER: TRoomHeaderActionKey[] = ['encryption', 'notifications', 'call', 'threads'];

const useOmnichannelActions = (rid: string, roomStore: RoomStore, enabled: boolean): IHeaderAction[] => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const livechatRequestComment = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;

	const departmentId = useStore(
		roomStore,
		fromSubscription(room => room.departmentId, undefined)
	);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canReturnQueue = useCanReturnQueue(enabled);
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(roomStore);

	if (!enabled) {
		return EMPTY_ACTIONS;
	}

	const returnInquiry = () => {
		showConfirmationAlert({
			message: i18n.t('Would_you_like_to_return_the_inquiry'),
			confirmationText: i18n.t('Yes'),
			onPress: async () => {
				try {
					await returnLivechat(rid, departmentId);
				} catch (e: any) {
					showErrorAlert(e.reason, i18n.t('Oops'));
				}
			}
		});
	};

	const menu: IHeaderMenuItem[] = [
		...(canPlaceLivechatOnHold
			? [{ label: i18n.t('Place_chat_on_hold'), icon: 'pause' as const, onPress: () => placeLivechatOnHold({ rid, navigation }) }]
			: []),
		...(canForwardGuest
			? [
					{
						label: i18n.t('Forward_Chat'),
						icon: 'chat-forward' as const,
						onPress: () => navigateToScreen({ navigation, isMasterDetail, screen: 'ForwardLivechatView', params: { rid } })
					}
				]
			: []),
		...(canReturnQueue
			? [{ label: i18n.t('Return_to_waiting_line'), icon: 'move-to-the-queue' as const, onPress: returnInquiry }]
			: []),
		{
			label: i18n.t('Close'),
			icon: 'chat-close',
			destructive: true,
			onPress: () => closeLivechat({ rid, departmentId, isMasterDetail, livechatRequestComment, navigation })
		}
	];

	return [
		{
			label: i18n.t('More'),
			icon: 'kebab',
			testID: 'room-view-header-omnichannel-kebab',
			onPress: () => logEvent(events.ROOM_SHOW_MORE_ACTIONS),
			menu
		}
	];
};

const useThreadActions = (tmid: string | undefined, enabled: boolean): IHeaderAction[] => {
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	if (!enabled) {
		return EMPTY_ACTIONS;
	}

	return [
		{
			label: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
			icon: isFollowingThread ? 'notification' : 'notification-disabled',
			testID: isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow',
			onPress: () => {
				logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
				if (tmid) {
					toggleFollowThread(tmid, isFollowingThread);
				}
			}
		}
	];
};

const useRoomActions = (rid: string, roomStore: RoomStore, enabled: boolean): IHeaderAction[] => {
	const { theme, colors } = useTheme();
	const {
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
		threadsAccessibilityLabel
	} = useRoomRightButtonsData(rid, roomStore);
	const { callPresent, isCallDisabled, onPressCall } = useHeaderCallPress(rid);

	if (!enabled) {
		return EMPTY_ACTIONS;
	}

	const present: Partial<Record<TRoomHeaderActionKey, boolean>> = {
		threads: threadsEnabled,
		call: !isSelfDm && callPresent,
		encryption: hasE2EEWarning,
		notifications: issuesWithNotifications || disableNotifications
	};

	const actions: Record<TRoomHeaderActionKey, IHeaderAction> = {
		threads: {
			label: threadsAccessibilityLabel,
			icon: 'threads',
			testID: 'room-view-header-threads',
			disabled: hasE2EEWarning,
			badge: tunread.length
				? {
						value: tunread.length,
						color: getUnreadStyle({ tunread, tunreadUser, tunreadGroup, theme }).backgroundColor as string
					}
				: undefined,
			onPress: goThreadsView
		},
		call: {
			label: callAccessibilityLabel,
			icon: 'phone',
			testID: 'room-view-header-call',
			disabled: hasE2EEWarning || isCallDisabled,
			onPress: onPressCall
		},
		encryption: {
			label: i18n.t('Encrypted'),
			icon: 'encrypted',
			testID: 'room-view-header-encryption',
			disabled: !canToggleEncryption,
			onPress: goE2EEToggleRoomView
		},
		notifications: {
			label: i18n.t('Troubleshooting'),
			icon: 'notification-disabled',
			testID: 'room-view-push-troubleshoot',
			tintColor: issuesWithNotifications ? colors.fontDanger : undefined,
			disabled: hasE2EEWarning,
			onPress: navigateToNotificationOrPushTroubleshoot
		}
	};

	const searchAction: IHeaderAction = {
		label: i18n.t('Search_Messages'),
		icon: 'search',
		testID: 'room-view-search',
		disabled: hasE2EEWarning,
		onPress: goSearchView
	};

	if (!hasNativeHeaderBar) {
		return [...VISIBLE_ORDER.filter(key => present[key]).map(key => actions[key]), searchAction];
	}

	const { visibleKeys, overflowKeys } = splitRoomHeaderActions(present);
	const toMenuItem = ({ label, icon, disabled, onPress }: IHeaderAction): IHeaderMenuItem => ({
		label,
		icon,
		disabled,
		onPress: onPress ?? (() => {})
	});

	return [
		...VISIBLE_ORDER.filter(key => visibleKeys.includes(key)).map(key => actions[key]),
		{
			label: i18n.t('More'),
			icon: 'kebab',
			menu: [...overflowKeys.map(key => toMenuItem(actions[key])), toMenuItem(searchAction)]
		}
	];
};

export const useRoomHeaderActions = (
	rid: string | undefined,
	tmid: string | undefined,
	roomStore: RoomStore
): IHeaderAction[] => {
	const { t, status, membership } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			status: fromSubscription(r => r.status, undefined)(s),
			membership: s.membership
		}))
	);

	const mode = getRoomHeaderMode({ rid, tmid, t, status, membership });

	const omnichannelActions = useOmnichannelActions(rid ?? '', roomStore, mode === 'omnichannel');
	const threadActions = useThreadActions(tmid, mode === 'thread');
	const roomActions = useRoomActions(rid ?? '', roomStore, mode === 'room');

	if (mode === 'omnichannel') {
		return omnichannelActions;
	}
	if (mode === 'thread') {
		return threadActions;
	}
	if (mode === 'room') {
		return roomActions;
	}
	return EMPTY_ACTIONS;
};
