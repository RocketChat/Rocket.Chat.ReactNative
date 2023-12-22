import { createContext, useContext } from 'react';

export type TMessageAction = 'reply' | 'quote' | 'edit' | 'react' | null;

export interface IRoomContext {
	rid: string;
	t: string;
	tmid?: string;
	sharing: boolean;
	action?: TMessageAction;
	selectedMessages?: string[];

	editCancel?: () => void;
	editRequest?: (message: any) => void;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage: (message: string, tshow?: boolean) => void;
}

// const initialContext = {
// 	rid: '',
// 	t: '',
// 	tmid: undefined,
// 	sharing: false,
// 	action: null,
// 	selectedMessages: [],

// 	editCancel: () => {},
// 	editRequest: () => {},
// 	onSendMessage: () => {},
// 	onRemoveQuoteMessage: () => {}
// };

export const RoomContext = createContext<IRoomContext>({} as IRoomContext);

export const useRoomContext = () => useContext(RoomContext);
