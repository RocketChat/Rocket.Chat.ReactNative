import { createContext, useContext } from 'react';

interface INativeListContext {
	sectionIndex: number;
}

export const NativeListContext = createContext<INativeListContext | null>(null);

export const useIsNativeList = () => useContext(NativeListContext) !== null;

export const useNativeListContext = () => useContext(NativeListContext);
