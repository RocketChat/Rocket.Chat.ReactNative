import { type ReactElement } from 'react';
import { isIOS } from '~/lib/methods/helpers';
import { type RoomStore } from '~/views/RoomView/definitions';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';
import { type HeaderAction } from '~/lib/methods/helpers/navigation';

import { useNavigation } from '@react-navigation/native';
import { type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';
import { ApplyRoomHeaderItems } from './ApplyRoomHeaderItems';
import i18n from '~/i18n';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { getUserSelector } from '~/selectors/login';
import { useThreadFollowing } from '~/views/RoomView/hooks/useThreadFollowing';

interface IThreadRightButtonsProps {
	tmid: string;
	roomStore: RoomStore;
}

export const ThreadRightButtons = ({ tmid, roomStore }: IThreadRightButtonsProps): ReactElement => {
	const onRoomInfoPress = useGoRoomActionsView(roomStore);
	const roomInfo: HeaderAction[] = isIOS
		? [{ type: 'button', label: i18n.t('Room_Info'), iconName: 'info', onPress: onRoomInfoPress }]
		: [];
	const navigation = useNavigation<TRoomStackNavigation>();
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		toggleFollowThread(tmid, isFollowingThread);
	};

	return (
		<ApplyRoomHeaderItems
			navigation={navigation}
			actions={[
				...roomInfo,
				{
					type: 'button',
					label: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
					iconName: isFollowingThread ? 'notification' : 'notification-disabled',
					onPress: onToggleFollowThread,
					testID: isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'
				}
			]}
		/>
	);
};
