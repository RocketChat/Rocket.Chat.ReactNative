import { useSetting } from '../../../lib/hooks/useSetting';
import { useStore } from 'zustand';
import { type RoomStore } from '../definitions';

export function useCanPlaceLivechatOnHold(roomStore: RoomStore): boolean {
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;
	const t = useStore(roomStore, s => s.room.t);
	const lastMessageFromAgent = useStore(roomStore, s => s.lastMessageFromAgent);
	const onHold = useStore(roomStore, s => s.roomUpdate.onHold);
	return t === 'l' && !!livechatAllowManualOnHold && lastMessageFromAgent && !onHold;
}
