import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState } from 'react-native';

import { navigateToAddServer } from '../navigation/addServer.ts';
import store from '../store';

let pendingQuickAction: string | null = null;
let quickActionConsumed = false;

let registered = false;

let currentAppState = AppState.currentState;

AppState.addEventListener('change', nextState => {
	if (currentAppState === 'active' && nextState !== 'active') {
		quickActionConsumed = false;
	}

	if (nextState === 'active') {
		consumePendingQuickAction();
	}

	currentAppState = nextState;
});

export function registerQuickActions() {
	if (registered) {
		return;
	}
	registered = true;

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

		pendingQuickAction = action.id;
	});
}

function consumePendingQuickAction() {
	if (!pendingQuickAction || quickActionConsumed) {
		return;
	}

	quickActionConsumed = true;

	console.log('consume block');

	const action = pendingQuickAction;
	pendingQuickAction = null;

	InteractionManager.runAfterInteractions(() => {
		handleQuickAction(action);
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
