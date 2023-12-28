import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { TMessageAction } from '../definitions';

export const RoomContext = createContext<State>({} as State);

export const useRoom = (): State => useContext(RoomContext);

type State = {
	rid: string;
	t: string;
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
	| { type: 'onRemoveQuoteMessage'; messageId: string };

const reducer = (state: State, action: Actions): State => {
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
	}
};

export const RoomProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, { action: null, selectedMessages: [] } as unknown as State);

	const api = useMemo(() => {
		const setRoom: State['setRoom'] = ({ rid, t, tmid, sendMessage, sharing, editCancel, editRequest }) =>
			dispatch({ type: 'setRoom', rid, t, tmid, sharing, sendMessage, editCancel, editRequest });

		const setAction: State['setAction'] = (action, messageId) => dispatch({ type: 'setAction', action, messageId });

		const resetAction = () => dispatch({ type: 'resetAction' });

		const onRemoveQuoteMessage = (messageId: string) => dispatch({ type: 'onRemoveQuoteMessage', messageId });

		return {
			setRoom,
			setAction,
			resetAction,
			onRemoveQuoteMessage
		};
	}, []);

	return <RoomContext.Provider value={{ ...api, ...state }}>{children}</RoomContext.Provider>;
};
