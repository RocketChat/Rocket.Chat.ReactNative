import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { IEmoji } from '../../definitions';
import { IAutocompleteBase, TMicOrSend } from './interfaces';

export type TMessageAction = 'reply' | 'quote' | 'edit' | 'react' | null;

export const NewRoomContext = createContext<State>({} as State);

export const useRoom = (): State => useContext(NewRoomContext);

type State = {
	rid?: string;
	t?: string;
	tmid?: string;
	sharing?: boolean;
	action: TMessageAction;
	selectedMessages: string[];
	setRoom: ({ rid, t, tmid, sendMessage }: { rid: string; t: string; tmid?: string; sendMessage: Function }) => void;
	setAction: (action: TMessageAction, messageId: string) => void;
	resetAction: () => void;
	editCancel?: () => void;
	editRequest?: (message: any) => void;
	onRemoveQuoteMessage?: (messageId: string) => void;
	sendMessage?: Function;
};

type Actions =
	| { type: 'setRoom'; rid: string; t: string; tmid?: string; sendMessage: Function }
	| { type: 'setAction'; action: TMessageAction; messageId: string }
	| { type: 'resetAction' };

const reducer = (state: State, action: Actions): State => {
	switch (action.type) {
		case 'setRoom':
			return { ...state, rid: action.rid, t: action.t, tmid: action.tmid, sendMessage: action.sendMessage };
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
	}
};

export const RoomProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, { action: null, selectedMessages: [] } as unknown as State);

	const api = useMemo(() => {
		const setRoom: State['setRoom'] = ({ rid, t, tmid, sendMessage }) => dispatch({ type: 'setRoom', rid, t, tmid, sendMessage });

		const setAction: State['setAction'] = (action, messageId) => dispatch({ type: 'setAction', action, messageId });

		const resetAction = () => dispatch({ type: 'resetAction' });

		return {
			setRoom,
			setAction,
			resetAction
		};
	}, []);

	return <NewRoomContext.Provider value={{ ...api, ...state }}>{children}</NewRoomContext.Provider>;
};
