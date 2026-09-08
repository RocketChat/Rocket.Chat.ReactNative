import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { type StoreApi } from 'zustand';

import { type IMessage, type IMessageEditAttachment } from '../../definitions';
import { type IRoomWithUpdateState, useRoomWithUpdateFromStore } from '../../lib/hooks/useRoomWithUpdateFromStore';
import { type TRoomOrPreview } from '../../definitions/TRoom';

export type ComposerState = IRoomWithUpdateState & {
	room: TRoomOrPreview;
	rid?: string;
	t?: string;
	tmid?: string;
	sharing?: boolean;
	isAutocompleteVisible: boolean;
	editCancel?: () => void;
	editRequest?: (message: Pick<IMessage, 'id' | 'msg' | 'rid'> & { attachments?: IMessageEditAttachment[] }) => Promise<void>;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage?: (message?: string, tshow?: boolean) => void;
	updateAutocompleteVisible: (updatedAutocompleteVisible: boolean) => void;
};

export type TComposerExternalState = Omit<ComposerState, 'isAutocompleteVisible' | 'updateAutocompleteVisible'>;
export type ComposerStore = StoreApi<ComposerState>;

export const createComposerStore = (initial: TComposerExternalState) =>
	createStore<ComposerState>()(set => ({
		...initial,
		isAutocompleteVisible: false,
		updateAutocompleteVisible: (isAutocompleteVisible: boolean) => set({ isAutocompleteVisible })
	}));

export const ComposerStoreContext = createContext<ComposerStore | null>(null);

export const useComposerStoreApi = (): ComposerStore => {
	const store = useContext(ComposerStoreContext);
	if (!store) {
		throw new Error('Composer store hooks must be used within a ComposerProvider');
	}
	return store;
};

const useComposerStore = <T,>(selector: (state: ComposerState) => T): T => useStore(useComposerStoreApi(), selector);

export const ComposerProvider = ({ children, ...state }: { children: ReactNode } & TComposerExternalState): ReactElement => {
	const [store] = useState(() => createComposerStore(state));

	useEffect(() => {
		const current = store.getState();
		const changedFields = Object.fromEntries(
			Object.entries(state).filter(([field, value]) => current[field as keyof ComposerState] !== value)
		) as Partial<ComposerState>;
		if (Object.keys(changedFields).length) {
			store.setState(changedFields);
		}
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
export const useUpdateAutocompleteVisible = (): ComposerState['updateAutocompleteVisible'] =>
	useComposerStore(s => s.updateAutocompleteVisible);
