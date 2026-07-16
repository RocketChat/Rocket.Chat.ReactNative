import { type ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TActionSheetOptionsItem, useActionSheet } from '../../../containers/ActionSheet';
import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { type ISubscription, type SubscriptionType, type TUserStatus } from '../../../definitions';
import { type ILivechatDepartment } from '../../../definitions/ILivechatDepartment';
import { type ILivechatTag } from '../../../definitions/ILivechatTag';
import i18n from '../../../i18n';
import { getRoomTitle, isGroupChat, showConfirmationAlert, showErrorAlert } from '../../../lib/methods/helpers';
import { closeLivechat as closeLivechatService } from '../../../lib/methods/helpers/closeLivechat';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import getRoomAccessibilityLabel from '../../../lib/helpers/getRoomAccessibilityLabel';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { getDepartmentInfo, getTagsList, onHoldLivechat, returnLivechat } from '../../../lib/services/restApi';
import { getUserSelector } from '../../../selectors/login';
import { type TNavigation } from '../../../stacks/stackType';
import { type ChatsStackParamList } from '../../../stacks/types';
import { useTheme } from '../../../theme';
import { HeaderCallButton } from './HeaderCallButton';
import { useE2EEStatus } from '../hooks/useE2EEStatus';
import { useRightButtons } from '../hooks/useRightButtons';
import { toggleFollowThread } from '../services/toggleFollowThread';
import { useRoomStoreByRid } from '../stores/RoomStore';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
}

type RightButtonsNavigation = NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'RoomView'>;

const placeOnHoldLivechat = (rid: string, navigation: RightButtonsNavigation) => {
	showConfirmationAlert({
		title: i18n.t('Are_you_sure_question_mark'),
		message: i18n.t('Would_like_to_place_on_hold'),
		confirmationText: i18n.t('Yes'),
		onPress: async () => {
			try {
				await onHoldLivechat(rid);
				navigation.navigate('RoomsListView');
			} catch (e: any) {
				showErrorAlert(e.data?.error, i18n.t('Oops'));
			}
		}
	});
};

const closeLivechat = async ({
	rid,
	departmentId,
	isMasterDetail,
	livechatRequestComment,
	navigation
}: {
	rid: string;
	departmentId?: string;
	isMasterDetail: boolean;
	livechatRequestComment: boolean;
	navigation: RightButtonsNavigation;
}) => {
	try {
		let departmentInfo: ILivechatDepartment | undefined;
		let tagsList: ILivechatTag[] | undefined;

		if (departmentId) {
			const result = await getDepartmentInfo(departmentId);
			if (result.success) {
				departmentInfo = result.department as ILivechatDepartment;
			}
		}

		if (departmentInfo?.requestTagBeforeClosingChat) {
			tagsList = await getTagsList();
		}

		if (!livechatRequestComment && !departmentInfo?.requestTagBeforeClosingChat) {
			const comment = i18n.t('Chat_closed_by_agent');
			return closeLivechatService({ rid, isMasterDetail, comment });
		}

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'CloseLivechatView',
				params: { rid, departmentId, departmentInfo, tagsList }
			});
		} else {
			navigation.navigate('CloseLivechatView', { rid, departmentId, departmentInfo, tagsList });
		}
	} catch {
		// do nothing
	}
};

const RightButtons = ({ rid, tmid }: IRightButtonsProps): ReactElement | null => {
	'use memo';

	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'RoomView'>>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();

	const userId = useAppSelector(state => getUserSelector(state).id);
	const threadsEnabled = useAppSelector(state => state.settings.Threads_enabled as boolean);
	const livechatRequestComment = useAppSelector(
		state => state.settings.Livechat_request_comment_when_closing_conversation as boolean
	);
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);

	const room = useRoomStoreByRid(rid, s => s.room);
	const canForwardGuest = useRoomStoreByRid(rid, s => s.canForwardGuest);
	const canReturnQueue = useRoomStoreByRid(rid, s => s.canReturnQueue);
	const canPlaceLivechatOnHold = useRoomStoreByRid(rid, s => s.canPlaceLivechatOnHold);

	const { showMissingE2EEKey, showE2EEDisabledRoom } = useE2EEStatus(rid);
	const hasE2EEWarning = !!('encrypted' in room && (showMissingE2EEKey || showE2EEDisabledRoom));

	const { isFollowingThread, tunread, tunreadUser, tunreadGroup, isSelfDm, canToggleEncryption, subscription } = useRightButtons({
		rid,
		tmid,
		userId
	});

	const t = room.t as SubscriptionType;
	const { status } = room;
	const roomName = getRoomTitle(room);
	const isGroupChatValue = isGroupChat(room as ISubscription);
	const teamMain = 'teamMain' in room ? room.teamMain : false;
	const encrypted = 'encrypted' in room ? room.encrypted : undefined;
	const departmentId = 'id' in room ? room.departmentId : undefined;

	const goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', { screen: 'ThreadMessagesView', params: { rid, t } });
		} else {
			navigation.navigate('ThreadMessagesView', { rid, t });
		}
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
				onPress: () => rid && placeOnHoldLivechat(rid, navigation)
			});
		}

		if (canForwardGuest) {
			options.push({
				title: i18n.t('Forward_Chat'),
				icon: 'chat-forward',
				onPress: () => {
					if (rid) {
						if (isMasterDetail) {
							navigation.navigate('ModalStackNavigator', {
								screen: 'ForwardLivechatView',
								params: { rid }
							});
						} else {
							navigation.navigate('ForwardLivechatView', { rid });
						}
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
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', {
					screen: 'NotificationPrefView',
					params: { rid, room: subscription }
				});
			} else {
				navigation.navigate('NotificationPrefView', { rid, room: subscription });
			}
		} else if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'PushTroubleshootView'
			});
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	};

	const goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'SearchMessagesView',
				params: { rid, showCloseModal: true, encrypted }
			});
		} else {
			navigation.navigate('SearchMessagesView', { rid, t, encrypted });
		}
	};

	const goE2EEToggleRoomView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'E2EEToggleRoomView',
				params: { rid }
			});
		} else {
			// @ts-ignore
			navigation.navigate('E2EEToggleRoomView', { rid });
		}
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
		!isGroupChatValue && t === 'd' && !!userId
			? roomName
			: getRoomAccessibilityLabel({ type: t, userId, isGroupChat: isGroupChatValue, status: status as TUserStatus, teamMain });

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
