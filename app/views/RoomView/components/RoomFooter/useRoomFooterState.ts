import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useRoomStore, useRoomWithUpdate } from '../../../../lib/store/RoomStoreContext';
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
	const airGappedRestrictionRemainingDays = useAppSelector(
		state => state.settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days as number | undefined
	);
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
