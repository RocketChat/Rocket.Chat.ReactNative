import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { TMessageAction } from '../definitions';

export const RoomContext = createContext<TRoomContext>({} as TRoomContext);

export const useRoom = (): TRoomContext => useContext(RoomContext);

export type TRoomContext = {
	rid?: string;
	t?: string;
	tmid?: string;
	sharing?: boolean;
	action: TMessageAction;
	selectedMessages: string[];
	setRoom: ({
		rid,
		t,
		tmid,
		sharing,
		sendMessage,
		editCancel,
		editRequest
	}: {
		rid: string;
		t: string;
		tmid?: string;
		sharing: boolean;
		sendMessage: Function;
		editCancel?: () => void;
		editRequest?: (message: any) => void;
	}) => void;
	setAction: (action: TMessageAction, messageId: string) => void;
	resetAction: () => void;
	reset: () => void;
	editCancel?: () => void;
	editRequest?: (message: any) => void;
	onRemoveQuoteMessage?: (messageId: string) => void;
	sendMessage: Function;
};

type Actions =
	| {
			type: 'setRoom';
			rid: string;
			t: string;
			tmid?: string;
			sharing: boolean;
			sendMessage: Function;
			editCancel?: () => void;
			editRequest?: (message: any) => void;
	  }
	| { type: 'setAction'; action: TMessageAction; messageId: string }
	| { type: 'resetAction' }
	| { type: 'onRemoveQuoteMessage'; messageId: string }
	| { type: 'reset' };

const reducer = (state: TRoomContext, action: Actions): TRoomContext => {
	switch (action.type) {
		case 'setRoom':
			return {
				...state,
				rid: action.rid,
				t: action.t,
				tmid: action.tmid,
				sharing: action.sharing,
				sendMessage: action.sendMessage,
				editCancel: action.editCancel,
				editRequest: action.editRequest
			};
		case 'setAction':
			const found = state.selectedMessages.find(id => id === action.messageId);
			if (found) return state;
			return {
				...state,
				action: action.action,
				selectedMessages: state.selectedMessages.concat(action.messageId)
			};
		case 'resetAction':
			return { ...state, action: null, selectedMessages: [] };
		case 'onRemoveQuoteMessage':
			const newSelectedMessages = state.selectedMessages.filter(id => id !== action.messageId);
			return { ...state, selectedMessages: newSelectedMessages, action: newSelectedMessages.length ? state.action : null };
		case 'reset':
			return { ...state, rid: undefined, t: undefined, tmid: undefined, sharing: false, action: null, selectedMessages: [] };
	}
};

export const RoomProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, { action: null, selectedMessages: [] } as unknown as TRoomContext);

	const api = useMemo(() => {
		const setRoom: TRoomContext['setRoom'] = ({ rid, t, tmid, sendMessage, sharing, editCancel, editRequest }) =>
			dispatch({ type: 'setRoom', rid, t, tmid, sharing, sendMessage, editCancel, editRequest });

		const setAction: TRoomContext['setAction'] = (action, messageId) => dispatch({ type: 'setAction', action, messageId });

		const resetAction = () => dispatch({ type: 'resetAction' });

		const onRemoveQuoteMessage = (messageId: string) => dispatch({ type: 'onRemoveQuoteMessage', messageId });

		const reset = () => dispatch({ type: 'reset' });

		return {
			setRoom,
			setAction,
			resetAction,
			onRemoveQuoteMessage,
			reset
		};
	}, []);

	return <RoomContext.Provider value={{ ...api, ...state }}>{children}</RoomContext.Provider>;
};
