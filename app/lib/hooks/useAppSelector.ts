import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { select } from 'redux-saga/effects';

import { IApplicationState } from '../../definitions';

export const useAppSelector: TypedUseSelectorHook<IApplicationState> = useSelector;

export function* appSelector<TSelected>(selector: (state: IApplicationState) => TSelected): Generator<any, TSelected, TSelected> {
	return yield select(selector);
}
