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

export function updateQuickActions({ recentRoomName }: { recentRoomName?: string } = {}) {
	QuickActions.setItems([
		{
			id: 'search',
			title: 'Search',
			icon: Platform.select({ ios: 'symbol:magnifyingglass', android: 'ic_quickaction_find' })
		},
		{
			id: 'add-server',
			title: 'Add Server',
			icon: Platform.select({ ios: 'symbol:plus', android: 'ic_quickaction_add' })
		},
		{
			id: 'recent',
			title: recentRoomName ?? 'Recent Rooms',
			subtitle: recentRoomName ? 'Last visited' : undefined,
			icon: Platform.select({
				ios: 'symbol:clock.arrow.trianglehead.counterclockwise.rotate.90',
				android: 'ic_quickaction_recent'
			})
		},
		{
			id: 'contact',
			title: Platform.select({ android: 'Contact us', ios: 'Something wrong?' }) ?? 'Contact us',
			subtitle: "We're here to help",
			icon: Platform.select({
				ios: 'symbol:envelope',
				android: 'ic_quickaction_contact'
			})
		}
	]);
}

export function registerQuickActions() {
	if (registered) {
		return;
	}
	registered = true;

	console.log('quickactions registered=======================');

	updateQuickActions();

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
	store.dispatch(
		quickActionHandle({
			action: id
		})
	);
}
