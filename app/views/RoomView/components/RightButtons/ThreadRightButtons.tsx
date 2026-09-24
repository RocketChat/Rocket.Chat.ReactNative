import { type ReactElement } from 'react';

import { events, logEvent } from '~/lib/methods/helpers/log';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { getUserSelector } from '~/selectors/login';
import { useThreadFollowing } from '~/views/RoomView/hooks/useThreadFollowing';
import { ThreadRightButtonsLegacy } from './ThreadRightButtonsLegacy';

interface IThreadRightButtonsProps {
	tmid: string;
}

export const ThreadRightButtons = ({ tmid }: IThreadRightButtonsProps): ReactElement => {
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		toggleFollowThread(tmid, isFollowingThread);
	};

	return <ThreadRightButtonsLegacy isFollowingThread={isFollowingThread} onToggleFollowThread={onToggleFollowThread} />;
};
