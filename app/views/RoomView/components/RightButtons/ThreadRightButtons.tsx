import { type ReactElement } from 'react';

import { isIOS, isTablet } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { getUserSelector } from '~/selectors/login';
import { useThreadFollowing } from '~/views/RoomView/hooks/useThreadFollowing';
import { ThreadRightButtonsLegacy } from './ThreadRightButtonsLegacy';
import { ThreadRightButtonsNative } from './ThreadRightButtonsNative';

interface IThreadRightButtonsProps {
	tmid: string;
}

export const ThreadRightButtons = ({ tmid }: IThreadRightButtonsProps): ReactElement => {
	const useNativeBar = isIOS && !isTablet;
	const userId = useAppSelector(state => getUserSelector(state).id);
	const isFollowingThread = useThreadFollowing(tmid, userId);

	const onToggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		toggleFollowThread(tmid, isFollowingThread);
	};

	if (useNativeBar) {
		return <ThreadRightButtonsNative isFollowingThread={isFollowingThread} onToggleFollowThread={onToggleFollowThread} />;
	}

	return <ThreadRightButtonsLegacy isFollowingThread={isFollowingThread} onToggleFollowThread={onToggleFollowThread} />;
};
