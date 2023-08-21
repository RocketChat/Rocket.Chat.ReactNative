import { createContext, useContext } from 'react';

export type TMessageAction = 'reply' | 'quote' | 'edit' | null;

interface IRoomContext {
	rid: string;
	tmid?: string;
	sharing: boolean;
	action: TMessageAction;
	selectedMessages: string[];

	editCancel: () => void;
	editRequest: (message: any) => void;
	onSendMessage: (message: any) => void;
	onRemoveQuoteMessage: (messageId: string) => void;
}

export const initialContext = {
	rid: '',
	tmid: undefined,
	sharing: false,
	action: null,
	selectedMessages: [],

	editCancel: () => {},
	editRequest: () => {},
	onSendMessage: () => {},
	onRemoveQuoteMessage: () => {}
};

export const RoomContext = createContext<IRoomContext>(initialContext);

export const useRoomContext = () => useContext(RoomContext);
