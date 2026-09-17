import { type ReactElement } from 'react';

import { showActionSheetRef } from '~/containers/ActionSheet';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { splitRoomHeaderActions, type TRoomHeaderActionKey } from '~/views/RoomView/helpers/roomHeaderActions';
import { type RoomStore } from '~/views/RoomView/definitions';
import { type useRoomRightButtonsData } from './useRoomRightButtonsData';
import { useRoomRightButtonsNativeData } from './useRoomRightButtonsNativeData';

interface IRoomRightButtonsNativeProps {
	rid: string;
	roomStore: RoomStore;
	data: ReturnType<typeof useRoomRightButtonsData>;
}

export const RoomRightButtonsNative = ({ rid, roomStore, data }: IRoomRightButtonsNativeProps): ReactElement => {
	const {
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
		threadsAccessibilityLabel
	} = data;
	const { callPresent, isCallDisabled, onPressCall, goRoomActionsView } = useRoomRightButtonsNativeData(rid, roomStore, isSelfDm);

	const { visibleKeys, overflowKeys } = splitRoomHeaderActions({
		threads: threadsEnabled,
		call: callPresent,
		encryption: hasE2EEWarning,
		notifications: issuesWithNotifications || disableNotifications
	});
	const isVisible = (key: TRoomHeaderActionKey) => visibleKeys.includes(key);

	const overflowOptions = [
		...overflowKeys.map(key => {
			if (key === 'threads') {
				return {
					title: threadsAccessibilityLabel,
					icon: 'threads' as const,
					testID: 'room-view-header-threads',
					onPress: goThreadsView
				};
			}
			if (key === 'encryption') {
				return {
					title: i18n.t('Encrypted'),
					icon: 'encrypted' as const,
					testID: 'room-view-header-encryption',
					enabled: canToggleEncryption,
					onPress: goE2EEToggleRoomView
				};
			}
			if (key === 'call') {
				return {
					title: callAccessibilityLabel,
					icon: 'phone' as const,
					testID: 'room-view-header-call',
					enabled: !isCallDisabled,
					onPress: onPressCall
				};
			}
			if (key === 'notifications') {
				return {
					title: i18n.t('Troubleshooting'),
					icon: 'notification-disabled' as const,
					testID: 'room-view-push-troubleshoot',
					onPress: navigateToNotificationOrPushTroubleshoot
				};
			}
			throw new Error(`Unhandled room header action key: ${key}`);
		}),
		{
			title: i18n.t('Search_Messages'),
			icon: 'search' as const,
			testID: 'room-view-search',
			enabled: !hasE2EEWarning,
			onPress: goSearchView
		},
		{
			title: i18n.t('Actions'),
			icon: 'kebab' as const,
			testID: 'room-view-header-room-actions',
			onPress: () => goRoomActionsView()
		}
	];

	return (
		<HeaderButton.Container>
			{isVisible('encryption') ? (
				<HeaderButton.Item
					iconName='encrypted'
					onPress={goE2EEToggleRoomView}
					disabled={!canToggleEncryption}
					testID='room-view-header-encryption'
				/>
			) : null}
			{isVisible('notifications') ? (
				<HeaderButton.Item
					color={issuesWithNotifications ? colors.fontDanger : ''}
					iconName='notification-disabled'
					onPress={navigateToNotificationOrPushTroubleshoot}
					testID='room-view-push-troubleshoot'
					disabled={hasE2EEWarning}
				/>
			) : null}
			{isVisible('call') ? (
				<HeaderButton.Item
					accessibilityLabel={callAccessibilityLabel}
					disabled={hasE2EEWarning || isCallDisabled}
					iconName='phone'
					onPress={onPressCall}
					testID='room-view-header-call'
				/>
			) : null}
			{isVisible('threads') ? (
				<HeaderButton.Item
					accessibilityLabel={threadsAccessibilityLabel}
					iconName='threads'
					onPress={goThreadsView}
					testID='room-view-header-threads'
					badge={() => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />}
					disabled={hasE2EEWarning}
				/>
			) : null}
			<HeaderButton.Item
				accessibilityLabel={i18n.t('More')}
				iconName='kebab'
				onPress={() => showActionSheetRef({ options: overflowOptions })}
				testID='room-view-header-more'
			/>
		</HeaderButton.Container>
	);
};
