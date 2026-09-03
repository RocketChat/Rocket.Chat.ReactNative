import { useShallow } from 'zustand/react/shallow';

import { useSetting } from '../../../lib/hooks/useSetting';
import { useRoomStoreByRid } from '../stores/RoomStore';

export function useCanPlaceLivechatOnHold(rid?: string): boolean {
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;
	const { t, lastMessageFromAgent, onHold } = useRoomStoreByRid(
		rid,
		useShallow(s => ({ t: s.room.t, lastMessageFromAgent: s.lastMessageFromAgent, onHold: s.roomUpdate.onHold }))
	);
	return t === 'l' && !!livechatAllowManualOnHold && lastMessageFromAgent && !onHold;
}
