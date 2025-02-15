import type { Store, Action } from 'redux';

import type { IApplicationState } from '../../definitions';

// https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
export let store: Store<IApplicationState> = null as any;

export const initStore = <A extends Action>(_store: Store<IApplicationState, A> ): void => {
	store = _store;
};
