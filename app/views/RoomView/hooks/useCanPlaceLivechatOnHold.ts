import { useSetting } from '../../../lib/hooks/useSetting';
import { useRoomStoreByRid } from '../stores/RoomStore';

export function useCanPlaceLivechatOnHold(rid?: string): boolean {
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;
	const t = useRoomStoreByRid(rid, s => s.room.t);
	const lastMessageFromAgent = useRoomStoreByRid(rid, s => s.lastMessageFromAgent);
	const onHold = useRoomStoreByRid(rid, s => s.roomUpdate.onHold);
	return t === 'l' && !!livechatAllowManualOnHold && lastMessageFromAgent && !onHold;
}
