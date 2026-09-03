import { useSetting } from '../../../../lib/hooks/useSetting';
import { useRoomStore, useRoomWithUpdate } from '../../stores/RoomStoreContext';
import { useFooterMessage } from './useFooterMessage';

export type TRoomFooterState =
	| { kind: 'onHold' }
	| { kind: 'takeOrJoin' }
	| { kind: 'airgapped' }
	| { kind: 'preview'; message: string }
	| { kind: 'composer' };

export const useRoomFooterState = (): TRoomFooterState => {
	const room = useRoomWithUpdate();
	const joined = useRoomStore(s => s.joined);
	const airGappedRestrictionRemainingDays = useSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days') as
		| number
		| undefined;
	const footerMessage = useFooterMessage();

	if ('onHold' in room && room.onHold) {
		return { kind: 'onHold' };
	}
	if (!joined) {
		return { kind: 'takeOrJoin' };
	}
	if (airGappedRestrictionRemainingDays === 0) {
		return { kind: 'airgapped' };
	}
	if (footerMessage) {
		return { kind: 'preview', message: footerMessage };
	}
	return { kind: 'composer' };
};
