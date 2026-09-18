import { type RoomStore } from '~/views/RoomView/definitions';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';
import { useHeaderCallPress } from './useHeaderCallPress';

export const useRoomRightButtonsNativeData = (rid: string, roomStore: RoomStore, isSelfDm: boolean) => {
	const goRoomActionsView = useGoRoomActionsView(roomStore);
	const { callPresent, isCallDisabled, onPressCall } = useHeaderCallPress(rid);

	return {
		callPresent: !isSelfDm && callPresent,
		isCallDisabled,
		onPressCall,
		goRoomActionsView
	};
};
