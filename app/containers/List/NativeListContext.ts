import { createContext, type ReactElement } from 'react';

export type TNativeListMode = false | 'native' | 'hosted';

export const NativeListContext = createContext<TNativeListMode>(false);

export const NativeListRowRendererContext = createContext<(row: ReactElement) => ReactElement>(row => row);
