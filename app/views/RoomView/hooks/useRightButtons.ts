import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IUseRightButtonsParams, type IUseRightButtonsResult } from '../definitions';
import { useSubscriptionUnreads } from './useSubscriptionUnreads';
import { useThreadFollowing } from './useThreadFollowing';

export function useRightButtons({ rid, tmid, userId }: IUseRightButtonsParams): IUseRightButtonsResult {
	const isFollowingThread = useThreadFollowing(tmid, userId);
	const { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription } = useSubscriptionUnreads(rid, userId);
	const [canToggleEncryption] = usePermissions(['toggle-room-e2e-encryption'], rid);

	return { isFollowingThread, tunread, tunreadUser, tunreadGroup, isSelfDm, canToggleEncryption, subscription };
}
