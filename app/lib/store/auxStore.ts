import { Store } from 'redux';

import { IApplicationState } from '../../definitions';

// https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
export let store: Store<IApplicationState> = null as any;

export const initStore = (_store: Store): void => {
	store = _store;
};
