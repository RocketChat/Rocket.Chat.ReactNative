import { type TypedUseSelectorHook, useSelector } from 'react-redux';
import { select } from 'redux-saga/effects';

import { type IApplicationState } from '~/definitions/redux';

export const useAppSelector: TypedUseSelectorHook<IApplicationState> = useSelector;

export function* appSelector<TSelected>(selector: (state: IApplicationState) => TSelected): Generator<any, TSelected, TSelected> {
	return yield select(selector);
}
