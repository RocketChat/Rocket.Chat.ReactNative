import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useNavigation } from '@react-navigation/native';

import { type TActionSheetOptionsItem, useActionSheet } from '../../../containers/ActionSheet';
import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { type ISubscription, type SubscriptionType, type TUserStatus } from '../../../definitions';
import i18n from '../../../i18n';
import { getRoomTitle, isGroupChat, showConfirmationAlert, showErrorAlert } from '../../../lib/methods/helpers';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import getRoomAccessibilityLabel from '../../../lib/helpers/getRoomAccessibilityLabel';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useSetting } from '../../../lib/hooks/useSetting';
import { useCanReturnQueue } from '../../../ee/omnichannel/hooks/useCanReturnQueue';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { usePermissions } from '../../../lib/hooks/usePermissions';
import { returnLivechat } from '../../../lib/services/restApi';
import { getUserSelector } from '../../../selectors/login';
import { useTheme } from '../../../theme';
import { HeaderCallButton } from './HeaderCallButton';
import { useCanPlaceLivechatOnHold } from '../hooks/useCanPlaceLivechatOnHold';
import { useE2EEStatus } from '../hooks/useE2EEStatus';
import { useSubscriptionUnreads } from '../hooks/useSubscriptionUnreads';
import { useThreadFollowing } from '../hooks/useThreadFollowing';
import { navigateToScreen, type TRoomStackNavigation } from '../hooks/navigateToScreen';
import { closeLivechat } from '../services/closeLivechat';
import { getRoomHeaderFields } from '../services/getRoomHeaderFields';
import { placeLivechatOnHold } from '../services/placeLivechatOnHold';
import { toggleFollowThread } from '../../../lib/methods/toggleFollowThread';
import { type RoomStore } from '../definitions';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();

	const userId = useAppSelector(state => getUserSelector(state).id);
	const threadsEnabled = useSetting('Threads_enabled') as boolean;
	const livechatRequestComment = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);

	const room = useStore(roomStore, s => s.room);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canReturnQueue = useCanReturnQueue(room.t === 'l');
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(roomStore);

	const { hasE2EEWarning } = useE2EEStatus(roomStore);

	const isFollowingThread = useThreadFollowing(tmid, userId);
	const { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription } = useSubscriptionUnreads(roomStore, userId);
	const [canToggleEncryption] = usePermissions(['toggle-room-e2e-encryption'], rid);

	const t = room.t as SubscriptionType;
	const { status } = room;
	const roomName = getRoomTitle(room);
	const roomIsGroupChat = isGroupChat(room as ISubscription);
	const { teamMain, encrypted, departmentId } = getRoomHeaderFields(room);

	const goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		if (!rid) {
			return;
		}
		navigateToScreen({ navigation, isMasterDetail, screen: 'ThreadMessagesView', params: { rid, t } });
	};

	const handleReturnLivechat = () => {
		if (rid) {
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
		}
	};

	const showMoreActions = () => {
		logEvent(events.ROOM_SHOW_MORE_ACTIONS);
		const options = [] as TActionSheetOptionsItem[];
		if (canPlaceLivechatOnHold) {
			options.push({
				title: i18n.t('Place_chat_on_hold'),
				icon: 'pause',
				onPress: () => rid && placeLivechatOnHold({ rid, navigation })
			});
		}

		if (canForwardGuest) {
			options.push({
				title: i18n.t('Forward_Chat'),
				icon: 'chat-forward',
				onPress: () => {
					if (rid) {
						navigateToScreen({ navigation, isMasterDetail, screen: 'ForwardLivechatView', params: { rid } });
					}
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
			onPress: () => rid && closeLivechat({ rid, departmentId, isMasterDetail, livechatRequestComment, navigation }),
			danger: true
		});

		showActionSheet({ options });
	};

	const navigateToNotificationOrPushTroubleshoot = () => {
		if (!rid || !subscription) {
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
		if (!rid) {
			return;
		}
		navigateToScreen({
			navigation,
			isMasterDetail,
			screen: 'SearchMessagesView',
			params: isMasterDetail ? { rid, t, encrypted, showCloseModal: true } : { rid, t, encrypted }
		});
	};

	const goE2EEToggleRoomView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		if (!rid) {
			return;
		}
		navigateToScreen({ navigation, isMasterDetail, screen: 'E2EEToggleRoomView', params: { rid } });
	};

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		if (tmid) {
			toggleFollowThread(tmid, isFollowingThread);
		}
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

	if (!rid) {
		return null;
	}

	if (status === 'INVITED') {
		return null;
	}

	if (t === 'l') {
		if (status !== 'queued') {
			return (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='kebab' onPress={showMoreActions} testID='room-view-header-omnichannel-kebab' />
				</HeaderButton.Container>
			);
		}
		return null;
	}
	if (tmid) {
		return (
			<HeaderButton.Container>
				<HeaderButton.Item
					accessibilityLabel={i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread')}
					iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
					onPress={onToggleFollowThread}
					testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
				/>
			</HeaderButton.Container>
		);
	}
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

export default RightButtons;
