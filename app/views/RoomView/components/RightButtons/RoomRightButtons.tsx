import { type ReactElement } from 'react';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { type RoomStore } from '~/views/RoomView/definitions';
import { HeaderCallButton } from './HeaderCallButton';
import { useRoomRightButtonsData } from './useRoomRightButtonsData';

interface IRoomRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const RoomRightButtons = ({ rid, roomStore }: IRoomRightButtonsProps): ReactElement => {
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
	} = useRoomRightButtonsData(rid, roomStore);

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
			{issuesWithNotifications || disableNotifications ? (
				<HeaderButton.Item
					color={issuesWithNotifications ? colors.fontDanger : ''}
					iconName='notification-disabled'
					onPress={navigateToNotificationOrPushTroubleshoot}
					testID='room-view-push-troubleshoot'
					disabled={hasE2EEWarning}
				/>
			) : null}
			{!isSelfDm ? <HeaderCallButton accessibilityLabel={callAccessibilityLabel} rid={rid} disabled={hasE2EEWarning} /> : null}
			{threadsEnabled ? (
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
				accessibilityLabel={i18n.t('Search_Messages')}
				iconName='search'
				onPress={goSearchView}
				testID='room-view-search'
				disabled={hasE2EEWarning}
			/>
		</HeaderButton.Container>
	);
};
