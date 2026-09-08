import { type ReactElement } from 'react';

import * as HeaderButton from '../../../../containers/Header/components/HeaderButton';
import i18n from '../../../../i18n';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { toggleFollowThread } from '../../../../lib/methods/toggleFollowThread';
import { getUserSelector } from '../../../../selectors/login';
import { useThreadFollowing } from '../../hooks/useThreadFollowing';

export const ThreadRightButtons = ({ tmid }: { tmid: string }): ReactElement => {
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		toggleFollowThread(tmid, isFollowingThread);
	};

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
};
