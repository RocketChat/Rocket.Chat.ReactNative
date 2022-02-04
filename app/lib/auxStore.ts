import { Store } from 'redux';

import { IApplicationState } from '../definitions';

export let store: Store<IApplicationState> = null as any;

export const initStore = (_store: Store): void => {
	store = _store;
};
