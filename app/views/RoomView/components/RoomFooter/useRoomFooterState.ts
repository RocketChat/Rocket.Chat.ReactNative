import { useSetting } from '../../../../lib/hooks/useSetting';
import { useRoomStore } from '../../stores/RoomStoreContext';
import { useFooterMessage } from './useFooterMessage';

export type TRoomFooterState =
	| { kind: 'onHold' }
	| { kind: 'takeOrJoin' }
	| { kind: 'airgapped' }
	| { kind: 'preview'; message: string }
	| { kind: 'composer' };

export const useRoomFooterState = (): TRoomFooterState => {
	const onHold = useRoomStore(s => !!s.room.onHold);
	const isSubscribed = useRoomStore(s => s.membership === 'subscribed');
	const airGappedRestrictionRemainingDays = useSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days') as
		| number
		| undefined;
	const footerMessage = useFooterMessage();

	if (onHold) {
		return { kind: 'onHold' };
	}
	if (!isSubscribed) {
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
