import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState, Platform } from 'react-native';

import store from '../store';
import { getRecentQuickAction } from './getInitialQuickAction';
import { quickActionHandle } from '../../actions/quickActions';

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
		{
			id: 'add-server',
			title: 'Add Server',
			icon: Platform.select({ ios: 'symbol:plus', android: 'ic_quickaction_add' }),
			href: ''
		},
		{
			id: 'search',
			title: 'Search',
			icon: Platform.select({ ios: 'symbol:magnifyingglass', android: 'ic_quickaction_find' }),
			href: ''
		},
		{
			id: 'recent',
			title: 'Recent Rooms',
			icon: Platform.select({
				ios: 'symbol:clock.arrow.trianglehead.counterclockwise.rotate.90',
				android: 'ic_quickaction_recent'
			}),
			href: ''
		}
	]);

	QuickActions.addListener(action => {
		console.log(action, 'quickactions=======================');
		if (!action?.id) {
			console.log('return block');
			return;
		}
		handleQuickAction(action.id);
	});
}

function handleQuickAction(id: string) {
	switch (id) {
		case 'add-server':
			store.dispatch(
				quickActionHandle({
					action: 'add-server'
				})
			);
			break;

		case 'search':
			store.dispatch(
				quickActionHandle({
					action: 'search'
				})
			);
			break;

		case 'recent':
			store.dispatch(
				quickActionHandle({
					action: 'recent'
				})
			);
			break;
	}
}
