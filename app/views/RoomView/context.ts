import { createContext, useContext } from 'react';

interface IRoomContext {
	selectedMessages: string[];

	onRemoveQuoteMessage: (messageId: string) => void;
}

export const RoomContext = createContext<IRoomContext>({
	selectedMessages: [],

	onRemoveQuoteMessage: () => {}
});

export const useRoomContext = () => useContext(RoomContext);
