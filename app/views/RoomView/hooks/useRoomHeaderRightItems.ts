import { useNavigation } from '@react-navigation/native';
import { type NativeStackHeaderItem, type NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '~/ee/omnichannel/hooks/useCanReturnQueue';
import { useSetting } from '~/lib/hooks/useSetting';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { headerIcon } from '~/lib/methods/helpers/navigation/headerIcon';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { returnLivechat } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
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

const EMPTY_ITEMS: NativeStackHeaderItem[] = [];

const getTunreadBadgeColor = (
	tunreadUser: string[],
	tunreadGroup: string[],
	colors: { badgeBackgroundLevel4: string; badgeBackgroundLevel3: string; fontInfo: string }
) => {
	if (tunreadUser.length) return colors.badgeBackgroundLevel4;
	if (tunreadGroup.length) return colors.badgeBackgroundLevel3;
	return colors.fontInfo;
};

const useOmnichannelRightItems = (rid: string, roomStore: RoomStore, enabled: boolean): NativeStackHeaderItem[] => {
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

	const handleReturnLivechat = () => {
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

	const moreActions: NativeStackHeaderItemMenuAction[] = [];
	if (canPlaceLivechatOnHold) {
		moreActions.push({
			type: 'action',
			label: i18n.t('Place_chat_on_hold'),
			icon: headerIcon('pause'),
			onPress: () => placeLivechatOnHold({ rid, navigation })
		});
	}
	if (canForwardGuest) {
		moreActions.push({
			type: 'action',
			label: i18n.t('Forward_Chat'),
			icon: headerIcon('chat-forward'),
			onPress: () => navigateToScreen({ navigation, isMasterDetail, screen: 'ForwardLivechatView', params: { rid } })
		});
	}
	if (canReturnQueue) {
		moreActions.push({
			type: 'action',
			label: i18n.t('Return_to_waiting_line'),
			icon: headerIcon('move-to-the-queue'),
			onPress: handleReturnLivechat
		});
	}
	moreActions.push({
		type: 'action',
		label: i18n.t('Close'),
		icon: headerIcon('chat-close'),
		destructive: true,
		onPress: () => closeLivechat({ rid, departmentId, isMasterDetail, livechatRequestComment, navigation })
	});

	if (!enabled) {
		return EMPTY_ITEMS;
	}

	return [
		{
			type: 'menu',
			label: i18n.t('More'),
			accessibilityLabel: i18n.t('More'),
			icon: headerIcon('kebab'),
			menu: { items: moreActions }
		}
	];
};

const useThreadRightItems = (tmid: string | undefined, enabled: boolean): NativeStackHeaderItem[] => {
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		if (tmid) {
			toggleFollowThread(tmid, isFollowingThread);
		}
	};

	if (!enabled) {
		return EMPTY_ITEMS;
	}

	return [
		{
			type: 'button',
			label: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
			accessibilityLabel: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
			icon: headerIcon(isFollowingThread ? 'notification' : 'notification-disabled'),
			onPress: onToggleFollowThread
		}
	];
};

const useRoomRightItems = (rid: string, roomStore: RoomStore, enabled: boolean): NativeStackHeaderItem[] => {
	const { colors } = useTheme();
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
	const { callPresent: callPresentRaw, isCallDisabled, onPressCall } = useHeaderCallPress(rid);
	const callPresent = !isSelfDm && callPresentRaw;

	const { visibleKeys, overflowKeys } = splitRoomHeaderActions({
		threads: threadsEnabled,
		call: callPresent,
		encryption: hasE2EEWarning,
		notifications: issuesWithNotifications || disableNotifications
	});
	const isVisible = (key: TRoomHeaderActionKey) => visibleKeys.includes(key);

	const tunreadBadge =
		threadsEnabled && tunread.length
			? { value: tunread.length, style: { backgroundColor: getTunreadBadgeColor(tunreadUser ?? [], tunreadGroup ?? [], colors) } }
			: undefined;

	const overflowActions: NativeStackHeaderItemMenuAction[] = [
		...overflowKeys.map(
			(key): NativeStackHeaderItemMenuAction =>
				key === 'encryption'
					? {
							type: 'action',
							label: i18n.t('Encrypted'),
							icon: headerIcon('encrypted'),
							disabled: !canToggleEncryption,
							onPress: goE2EEToggleRoomView
						}
					: {
							type: 'action',
							label: i18n.t('Troubleshooting'),
							icon: headerIcon('notification-disabled'),
							disabled: hasE2EEWarning,
							onPress: navigateToNotificationOrPushTroubleshoot
						}
		),
		{
			type: 'action',
			label: i18n.t('Search_Messages'),
			icon: headerIcon('search'),
			disabled: hasE2EEWarning,
			onPress: goSearchView
		}
	];

	if (!enabled) {
		return EMPTY_ITEMS;
	}

	const items: NativeStackHeaderItem[] = [];
	if (isVisible('encryption')) {
		items.push({
			type: 'button',
			label: i18n.t('Encrypted'),
			accessibilityLabel: i18n.t('Encrypted'),
			icon: headerIcon('encrypted'),
			disabled: !canToggleEncryption,
			onPress: goE2EEToggleRoomView
		});
	}
	if (isVisible('notifications')) {
		items.push({
			type: 'button',
			label: i18n.t('Troubleshooting'),
			accessibilityLabel: i18n.t('Troubleshooting'),
			icon: headerIcon('notification-disabled'),
			tintColor: issuesWithNotifications ? colors.fontDanger : undefined,
			disabled: hasE2EEWarning,
			onPress: navigateToNotificationOrPushTroubleshoot
		});
	}
	if (isVisible('call')) {
		items.push({
			type: 'button',
			label: callAccessibilityLabel,
			accessibilityLabel: callAccessibilityLabel,
			icon: headerIcon('phone'),
			disabled: hasE2EEWarning || isCallDisabled,
			onPress: onPressCall
		});
	}
	if (isVisible('threads')) {
		items.push({
			type: 'button',
			label: threadsAccessibilityLabel,
			accessibilityLabel: threadsAccessibilityLabel,
			icon: headerIcon('threads'),
			disabled: hasE2EEWarning,
			badge: tunreadBadge,
			onPress: goThreadsView
		});
	}
	items.push({
		type: 'menu',
		label: i18n.t('More'),
		accessibilityLabel: i18n.t('More'),
		icon: headerIcon('kebab'),
		menu: { items: overflowActions }
	});

	return items;
};

export const useRoomHeaderRightItems = (
	rid: string | undefined,
	tmid: string | undefined,
	roomStore: RoomStore
): NativeStackHeaderItem[] => {
	const { t, status, membership } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			status: fromSubscription(r => r.status, undefined)(s),
			membership: s.membership
		}))
	);

	const mode = getRoomHeaderMode({ rid, tmid, t, status, membership });

	const omnichannelItems = useOmnichannelRightItems(rid ?? '', roomStore, mode === 'omnichannel');
	const threadItems = useThreadRightItems(tmid, mode === 'thread');
	const roomItems = useRoomRightItems(rid ?? '', roomStore, mode === 'room');

	if (mode === 'omnichannel') {
		return omnichannelItems;
	}
	if (mode === 'thread') {
		return threadItems;
	}
	if (mode === 'room') {
		return roomItems;
	}
	return EMPTY_ITEMS;
};
