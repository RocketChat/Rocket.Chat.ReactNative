import { createContext, useContext, type ReactElement } from 'react';

export type TNativeListMode = false | 'native' | 'hosted';

interface INativeListContext {
	mode: TNativeListMode;
	renderRow: (row: ReactElement) => ReactElement;
}

export const NativeListContext = createContext<INativeListContext>({ mode: false, renderRow: row => row });

export const useNativeListMode = () => useContext(NativeListContext).mode;
