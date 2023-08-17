import { createContext, useContext } from 'react';

export type TMessageAction = 'reply' | 'quote' | 'edit' | null;

interface IRoomContext {
	action: TMessageAction;
	selectedMessages: string[];

	onRemoveQuoteMessage: (messageId: string) => void;
}

export const RoomContext = createContext<IRoomContext>({
	action: null,
	selectedMessages: [],

	onRemoveQuoteMessage: () => {}
});

export const useRoomContext = () => useContext(RoomContext);
