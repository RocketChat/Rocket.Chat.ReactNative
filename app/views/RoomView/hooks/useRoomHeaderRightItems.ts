import { useNavigation } from '@react-navigation/native';
import { type NativeStackHeaderItem } from '@react-navigation/native-stack';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { showActionSheetRef, useActionSheet, type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '~/ee/omnichannel/hooks/useCanReturnQueue';
import { useSetting } from '~/lib/hooks/useSetting';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { returnLivechat } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import { type RoomStore } from '../definitions';
import { fromSubscription } from '../stores/RoomStoreContext';
import { closeLivechat } from '../services/closeLivechat';
import { placeLivechatOnHold } from '../services/placeLivechatOnHold';
import { navigateToScreen, type TRoomStackNavigation } from '../services/navigateToScreen';
import { splitRoomHeaderActions, type TRoomHeaderActionKey } from '../helpers/roomHeaderActions';
import { useCanPlaceLivechatOnHold } from './useCanPlaceLivechatOnHold';
import { useGoRoomActionsView } from './useGoRoomActionsView';
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
	const { showActionSheet } = useActionSheet();
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

	const showMoreActions = () => {
		logEvent(events.ROOM_SHOW_MORE_ACTIONS);
		const options = [] as TActionSheetOptionsItem[];
		if (canPlaceLivechatOnHold) {
			options.push({
				title: i18n.t('Place_chat_on_hold'),
				icon: 'pause',
				onPress: () => placeLivechatOnHold({ rid, navigation })
			});
		}
		if (canForwardGuest) {
			options.push({
				title: i18n.t('Forward_Chat'),
				icon: 'chat-forward',
				onPress: () => {
					navigateToScreen({ navigation, isMasterDetail, screen: 'ForwardLivechatView', params: { rid } });
				}
			});
		}
		if (canReturnQueue) {
			options.push({
				title: i18n.t('Return_to_waiting_line'),
				icon: 'move-to-the-queue',
				onPress: () => handleReturnLivechat()
			});
		}
		options.push({
			title: i18n.t('Close'),
			icon: 'chat-close',
			onPress: () => closeLivechat({ rid, departmentId, isMasterDetail, livechatRequestComment, navigation }),
			danger: true
		});
		showActionSheet({ options });
	};

	if (!enabled) {
		return EMPTY_ITEMS;
	}

	return [
		{
			type: 'button',
			label: i18n.t('More'),
			accessibilityLabel: i18n.t('More'),
			icon: { type: 'sfSymbol', name: 'ellipsis' },
			onPress: showMoreActions
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
			icon: { type: 'sfSymbol', name: isFollowingThread ? 'bell' : 'bell.slash' },
			onPress: onToggleFollowThread
		}
	];
};

const useRoomRightItems = (rid: string, roomStore: RoomStore, enabled: boolean): NativeStackHeaderItem[] => {
	const { colors } = useTheme();
	const data = useRoomRightButtonsData(rid, roomStore);
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
	} = data;
	const { callPresent: callPresentRaw, isCallDisabled, onPressCall } = useHeaderCallPress(rid);
	const callPresent = !isSelfDm && callPresentRaw;
	const goRoomActions = useGoRoomActionsView(roomStore);

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

	const overflowOptions = [
		...overflowKeys.map(key => {
			if (key === 'threads') {
				return { title: threadsAccessibilityLabel, icon: 'threads' as const, onPress: goThreadsView };
			}
			if (key === 'encryption') {
				return {
					title: i18n.t('Encrypted'),
					icon: 'encrypted' as const,
					enabled: canToggleEncryption,
					onPress: goE2EEToggleRoomView
				};
			}
			if (key === 'call') {
				return {
					title: callAccessibilityLabel,
					icon: 'phone' as const,
					enabled: !isCallDisabled,
					onPress: onPressCall
				};
			}
			if (key === 'notifications') {
				return {
					title: i18n.t('Troubleshooting'),
					icon: 'notification-disabled' as const,
					onPress: navigateToNotificationOrPushTroubleshoot
				};
			}
			throw new Error(`Unhandled room header action key: ${key}`);
		}),
		{ title: i18n.t('Search_Messages'), icon: 'search' as const, enabled: !hasE2EEWarning, onPress: goSearchView },
		{ title: i18n.t('Actions'), icon: 'kebab' as const, onPress: () => goRoomActions() }
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
			icon: { type: 'sfSymbol', name: 'lock' },
			disabled: !canToggleEncryption,
			onPress: goE2EEToggleRoomView
		});
	}
	if (isVisible('notifications')) {
		items.push({
			type: 'button',
			label: i18n.t('Troubleshooting'),
			accessibilityLabel: i18n.t('Troubleshooting'),
			icon: { type: 'sfSymbol', name: 'bell.slash' },
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
			icon: { type: 'sfSymbol', name: 'phone' },
			disabled: hasE2EEWarning || isCallDisabled,
			onPress: onPressCall
		});
	}
	if (isVisible('threads')) {
		items.push({
			type: 'button',
			label: threadsAccessibilityLabel,
			accessibilityLabel: threadsAccessibilityLabel,
			icon: { type: 'sfSymbol', name: 'bubble.left.and.bubble.right' },
			disabled: hasE2EEWarning,
			badge: tunreadBadge,
			onPress: goThreadsView
		});
	}
	items.push({
		type: 'button',
		label: i18n.t('More'),
		accessibilityLabel: i18n.t('More'),
		icon: { type: 'sfSymbol', name: 'ellipsis' },
		onPress: () => showActionSheetRef({ options: overflowOptions })
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

	const isInvited = membership === 'invited';
	const isOmnichannel = !!rid && !isInvited && t === 'l' && status !== 'queued' && membership === 'subscribed';
	const isThread = !!rid && !isInvited && !isOmnichannel && !!tmid;
	const isRoom = !!rid && !isInvited && !isOmnichannel && !isThread;

	const omnichannelItems = useOmnichannelRightItems(rid ?? '', roomStore, isOmnichannel);
	const threadItems = useThreadRightItems(tmid, isThread);
	const roomItems = useRoomRightItems(rid ?? '', roomStore, isRoom);

	if (!rid || isInvited) {
		return EMPTY_ITEMS;
	}
	if (isOmnichannel) {
		return omnichannelItems;
	}
	if (isThread) {
		return threadItems;
	}
	return roomItems;
};
