import { useNavigation } from '@react-navigation/native';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '~/ee/omnichannel/hooks/useCanReturnQueue';
import { useSetting } from '~/lib/hooks/useSetting';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
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
import { getRoomHeaderMode, type TRoomHeaderMode } from '../helpers/getRoomHeaderMode';
import { useCanPlaceLivechatOnHold } from './useCanPlaceLivechatOnHold';
import { useThreadFollowing } from './useThreadFollowing';
import { useRoomActionsState } from './useRoomActionsState';
import { useHeaderCallPress } from './useHeaderCallPress';

export const EMPTY_ACTIONS: IHeaderAction[] = [];

export const useOmnichannelActions = (rid: string, roomStore: RoomStore): IHeaderAction[] => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const livechatRequestComment = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;

	const departmentId = useStore(
		roomStore,
		fromSubscription(room => room.departmentId, undefined)
	);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canReturnQueue = useCanReturnQueue();
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(roomStore);

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

export const useThreadActions = (tmid: string): IHeaderAction[] => {
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	return [
		{
			label: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
			icon: isFollowingThread ? 'notification' : 'notification-disabled',
			testID: isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow',
			onPress: () => {
				logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
				toggleFollowThread(tmid, isFollowingThread);
			}
		}
	];
};

export const useRoomActions = (rid: string, roomStore: RoomStore): IHeaderAction[] => {
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
	} = useRoomActionsState(rid, roomStore);
	const { callPresent, isCallDisabled, onPressCall } = useHeaderCallPress(rid);

	const threadsAction: IHeaderAction = {
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
	};

	const showCall = !isSelfDm && callPresent;
	const showNotifications = issuesWithNotifications || disableNotifications;

	const menu: IHeaderMenuItem[] = [
		...(showCall
			? [
					{
						label: callAccessibilityLabel,
						icon: 'phone' as const,
						testID: 'room-view-header-call',
						disabled: hasE2EEWarning || isCallDisabled,
						onPress: onPressCall
					}
				]
			: []),
		...(hasE2EEWarning
			? [
					{
						label: i18n.t('Encrypted'),
						icon: 'encrypted' as const,
						testID: 'room-view-header-encryption',
						disabled: !canToggleEncryption,
						onPress: goE2EEToggleRoomView
					}
				]
			: []),
		...(showNotifications
			? [
					{
						label: i18n.t(issuesWithNotifications ? 'Troubleshooting' : 'Notification_Preferences'),
						icon: 'notification-disabled' as const,
						testID: 'room-view-push-troubleshoot',
						destructive: issuesWithNotifications,
						disabled: hasE2EEWarning,
						onPress: navigateToNotificationOrPushTroubleshoot
					}
				]
			: []),
		{
			label: i18n.t('Search_Messages'),
			icon: 'search',
			testID: 'room-view-search',
			disabled: hasE2EEWarning,
			onPress: goSearchView
		}
	];

	const moreAction: IHeaderAction = {
		label: i18n.t('More'),
		icon: 'kebab',
		testID: 'room-view-header-kebab',
		badge: showNotifications ? { color: colors.buttonBackgroundDangerDefault } : undefined,
		menu
	};

	return threadsEnabled ? [threadsAction, moreAction] : [moreAction];
};

export const useRoomHeaderMode = (tmid: string | undefined, roomStore: RoomStore): TRoomHeaderMode => {
	const { t, status, membership } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			status: fromSubscription(r => r.status, undefined)(s),
			membership: s.membership
		}))
	);

	return getRoomHeaderMode({ tmid, t, status, membership });
};
