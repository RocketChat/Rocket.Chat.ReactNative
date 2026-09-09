import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import { useSetting } from '../../../lib/hooks/useSetting';
import { type RoomStore } from '../definitions';

export function useCanPlaceLivechatOnHold(roomStore: RoomStore): boolean {
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;
	const { t, lastMessageFromAgent, onHold } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			lastMessageFromAgent: !!(s.room.lastMessage && !s.room.lastMessage.token && s.room.lastMessage.u),
			onHold: s.room.onHold
		}))
	);
	return t === 'l' && !!livechatAllowManualOnHold && lastMessageFromAgent && !onHold;
}
