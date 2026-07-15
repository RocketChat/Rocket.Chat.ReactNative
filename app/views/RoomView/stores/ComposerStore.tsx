import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

import { type ComposerState, type ComposerStore, type TComposerExternalState } from '../definitions';

export const createComposerStore = (initial: TComposerExternalState) =>
	createStore<ComposerState>()((set, get) => ({
		...initial,
		isAutocompleteVisible: false,
		updateAutocompleteVisible: (updatedAutocompleteVisible: boolean) => {
			if (updatedAutocompleteVisible !== get().isAutocompleteVisible) {
				set({ isAutocompleteVisible: updatedAutocompleteVisible });
			}
		}
	}));

export const ComposerStoreContext = createContext<ComposerStore | null>(null);

const useComposerStore = <T,>(selector: (state: ComposerState) => T): T => {
	const store = useContext(ComposerStoreContext);
	if (!store) {
		throw new Error('Composer store hooks must be used within a ComposerProvider');
	}
	return useStore(store, selector);
};

export const ComposerProvider = ({ children, ...state }: { children: ReactNode } & TComposerExternalState): ReactElement => {
	'use memo';

	const [store] = useState(() => createComposerStore(state));

	// isAutocompleteVisible/updateAutocompleteVisible are store-owned (seeded once above) and are not
	// synced here — only the externally-suppliable fields are kept in sync with props.
	useEffect(() => {
		store.setState({
			rid: state.rid,
			t: state.t,
			tmid: state.tmid,
			room: state.room,
			roomUpdate: state.roomUpdate,
			sharing: state.sharing,
			editCancel: state.editCancel,
			editRequest: state.editRequest,
			onRemoveQuoteMessage: state.onRemoveQuoteMessage,
			onSendMessage: state.onSendMessage,
			setQuotesAndText: state.setQuotesAndText,
			getText: state.getText
		});
	}, [
		state.rid,
		state.t,
		state.tmid,
		state.room,
		state.roomUpdate,
		state.sharing,
		state.editCancel,
		state.editRequest,
		state.onRemoveQuoteMessage,
		state.onSendMessage,
		state.setQuotesAndText,
		state.getText,
		store
	]);

	return <ComposerStoreContext.Provider value={store}>{children}</ComposerStoreContext.Provider>;
};

export const useComposerRid = (): ComposerState['rid'] => useComposerStore(s => s.rid);
export const useComposerType = (): ComposerState['t'] => useComposerStore(s => s.t);
export const useComposerTmid = (): ComposerState['tmid'] => useComposerStore(s => s.tmid);
export const useComposerRoom = (): ComposerState['room'] => {
	// The room model mutates in place, so tracked-column changes keep the same `room` reference.
	// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders the caller.
	useComposerStore(s => s.roomUpdate);
	return useComposerStore(s => s.room);
};
export const useComposerSharing = (): ComposerState['sharing'] => useComposerStore(s => s.sharing);
export const useIsAutocompleteVisible = (): ComposerState['isAutocompleteVisible'] =>
	useComposerStore(s => s.isAutocompleteVisible);
export const useEditCancel = (): ComposerState['editCancel'] => useComposerStore(s => s.editCancel);
export const useEditRequest = (): ComposerState['editRequest'] => useComposerStore(s => s.editRequest);
export const useOnRemoveQuoteMessage = (): ComposerState['onRemoveQuoteMessage'] => useComposerStore(s => s.onRemoveQuoteMessage);
export const useOnSendMessage = (): ComposerState['onSendMessage'] => useComposerStore(s => s.onSendMessage);
export const useSetQuotesAndText = (): ComposerState['setQuotesAndText'] => useComposerStore(s => s.setQuotesAndText);
export const useGetText = (): ComposerState['getText'] => useComposerStore(s => s.getText);
export const useUpdateAutocompleteVisible = (): ComposerState['updateAutocompleteVisible'] =>
	useComposerStore(s => s.updateAutocompleteVisible);
