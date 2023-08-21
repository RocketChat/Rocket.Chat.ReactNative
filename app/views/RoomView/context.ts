import { createContext, useContext } from 'react';

export type TMessageAction = 'reply' | 'quote' | 'edit' | null;

interface IRoomContext {
	rid: string;
	tmid?: string;
	editing: boolean;
	sharing: boolean;
	message: any;
	action: TMessageAction;
	selectedMessages: string[];

	editCancel: () => void;
	editRequest: (message: any) => void;
	onSendMessage: (message: any) => void;
	onRemoveQuoteMessage: (messageId: string) => void;
}

export const RoomContext = createContext<IRoomContext>({
	rid: '',
	tmid: undefined,
	editing: false,
	sharing: false,
	message: null,
	action: null,
	selectedMessages: [],

	editCancel: () => {},
	editRequest: () => {},
	onSendMessage: () => {},
	onRemoveQuoteMessage: () => {}
});

export const useRoomContext = () => useContext(RoomContext);
