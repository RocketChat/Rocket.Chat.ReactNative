import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

import { type ComposerState, type ComposerStore, type TComposerExternalState } from '../definitions';
import { useRoomWithUpdateFromStore } from './RoomStoreContext';

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

const useComposerStoreApi = (): ComposerStore => {
	const store = useContext(ComposerStoreContext);
	if (!store) {
		throw new Error('Composer store hooks must be used within a ComposerProvider');
	}
	return store;
};

const useComposerStore = <T,>(selector: (state: ComposerState) => T): T => useStore(useComposerStoreApi(), selector);

export const ComposerProvider = ({ children, ...state }: { children: ReactNode } & TComposerExternalState): ReactElement => {
	const [store] = useState(() => createComposerStore(state));

	// `state` is exactly TComposerExternalState (children is destructured out), so this syncs every
	// externally-suppliable field and none of the store-owned ones (isAutocompleteVisible/updateAutocompleteVisible).
	// React Compiler keeps `state` referentially stable until a field changes, so the sync fires only then.
	useEffect(() => {
		store.setState(state);
	}, [store, state]);

	return <ComposerStoreContext.Provider value={store}>{children}</ComposerStoreContext.Provider>;
};

export const useComposerRid = (): ComposerState['rid'] => useComposerStore(s => s.rid);
export const useComposerType = (): ComposerState['t'] => useComposerStore(s => s.t);
export const useComposerTmid = (): ComposerState['tmid'] => useComposerStore(s => s.tmid);
export const useComposerRoom = (): ComposerState['room'] => useRoomWithUpdateFromStore(useComposerStoreApi());
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
