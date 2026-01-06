import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState } from 'react-native';

import { navigateToAddServer } from '../navigation/addServer.ts';
import store from '../store';
import { getRecentQuickAction } from './getInitialQuickAction';

let registered = false;

AppState.addEventListener('change', async nextState => {
	if (nextState === 'active') {
		const nativeAction = await getRecentQuickAction();
		if (nativeAction) {
			InteractionManager.runAfterInteractions(() => {
				handleQuickAction(nativeAction);
			});
		}
	}
});

export function registerQuickActions() {
	if (registered) {
		return;
	}
	registered = true;

	console.log('quickactions registered=======================');

	QuickActions.setItems([
		{ id: 'add-server', title: 'Add Server', icon: 'plus', href: '' },
		{ id: 'search', title: 'Search', icon: 'search', href: '' },
		{ id: 'recent', title: 'Recent Rooms', icon: 'clock', href: '' }
	]);

	QuickActions.addListener(action => {
		console.log(action, 'quickactions=======================');
		if (!action?.id) {
			console.log('return block');
			return;
		}
		console.log('else block');
	});
}

function handleQuickAction(id: string) {
	switch (id) {
		case 'add-server':
			const state = store.getState();
			const server = state?.server?.server;
			navigateToAddServer(server);
			break;

		case 'search':
			console.log('search =========================');
			break;

		case 'recent':
			console.log('recent =========================');
			break;
	}
}
