import { useStore } from 'zustand';

import { useSetting } from '../../../lib/hooks/useSetting';
import { useRoomFromStore } from '../../../lib/hooks/useRoom';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { type RoomStore } from '../definitions';

const isOmnichannelOffHold = (snapshot: RoomSnapshot): boolean => {
	const room = getRoom(snapshot);
	return room.t === 'l' && !room.onHold;
};

export function useCanPlaceLivechatOnHold(roomStore: RoomStore): boolean {
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;
	const { snapshot } = useRoomFromStore(roomStore);
	const lastMessageFromAgent = useStore(roomStore, s => s.lastMessageFromAgent);
	return isOmnichannelOffHold(snapshot) && !!livechatAllowManualOnHold && lastMessageFromAgent;
}
