import { createContext } from 'react';

export type TNativeListMode = false | 'native' | 'hosted';

export const NativeListContext = createContext<TNativeListMode>(false);
