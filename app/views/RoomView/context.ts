import { createContext, useContext } from 'react';

import { type ILastMessage, type RoomType, type TSubscriptionModel } from '../../definitions';

export type TMessageAction = 'reply' | 'quote' | 'edit' | 'react' | null;

/**
 * Type for room in RoomContext, matching IRoomViewState.room
 * Can be either a full TSubscriptionModel or a partial room object (e.g., for threads)
 */
export type TRoomContextRoom =
	| TSubscriptionModel
	| {
			rid: string;
			t: RoomType;
			name?: string;
			fname?: string;
			prid?: string;
			joinCodeRequired?: boolean;
			status?: string;
			lastMessage?: ILastMessage;
			sysMes?: boolean;
			onHold?: boolean;
	  };

export interface IRoomContext {
	rid?: string;
	t?: string;
	tmid?: string;
	room: TRoomContextRoom;
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
