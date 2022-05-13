import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { IApplicationState } from '../../definitions';

export const useAppSelector: TypedUseSelectorHook<IApplicationState> = useSelector;
