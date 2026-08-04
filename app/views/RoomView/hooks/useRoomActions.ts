import { type IUseRoomActionsParams, type IUseRoomActionsResult } from '../definitions';
import { sendRoomMessage } from '../services/sendRoomMessage';

export function useRoomActions({ rid, tmid, roomStore, userRef, resetAction }: IUseRoomActionsParams): IUseRoomActionsResult {
	const handleSendMessage = (message?: string, tshow?: boolean) =>
		sendRoomMessage({ rid, message, tmid, user: userRef.current, tshow, roomStore, resetAction });

	const onJoin = () => {
		roomStore.getState().join();
	};

	return {
		onJoin,
		handleSendMessage
	};
}
