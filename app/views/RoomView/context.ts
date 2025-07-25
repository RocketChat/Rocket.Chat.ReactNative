import { createContext, useContext } from 'react';

export type TMessageAction = 'reply' | 'quote' | 'edit' | 'react' | null;

export interface IRoomContext {
	rid?: string;
	t?: string;
	tmid?: string;
	sharing?: boolean;
	action?: TMessageAction;
	isAutocompleteVisible?: boolean;
	selectedMessages: string[];
	editCancel?: () => void;
	editRequest?: (message: any) => void;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage?: Function;
	setQuotesAndText?: (text: string, quotes: string[]) => void;
	getText?: () => string | undefined;
	updateAutocompleteVisible?: (updatedAutocompleteVisible: boolean) => void;
}

export const RoomContext = createContext<IRoomContext>({} as IRoomContext);

export const useRoomContext = () => useContext(RoomContext);
