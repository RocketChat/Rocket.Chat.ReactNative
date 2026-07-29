import { createContext, useContext } from 'react';

export interface IRoomContext {
	rid?: string;
	t?: string;
	tmid?: string;
	room: any; // FIXME: type it properly after we migrate RoomView to hooks
	sharing?: boolean;
	isAutocompleteVisible?: boolean;
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
