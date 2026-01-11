import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState, Platform } from 'react-native';

import store from '../store';
import { getRecentQuickAction } from './getRecentQuickAction';
import { quickActionHandle } from '../../actions/quickActions';
import I18n from '../../i18n';

let registered = false;

let quickActionSubscription: { remove(): void } | null = null;
let appStateSubscription: { remove(): void } | null = null;

export async function updateQuickActions({ recentRoomName }: { recentRoomName?: string } = {}) {
	await QuickActions.setItems([
		{
			id: 'search',
			title: I18n.t('Search'),
			icon: Platform.select({ ios: 'symbol:magnifyingglass', android: 'ic_quickaction_find' })
		},
		{
			id: 'add-server',
			title: I18n.t('Add_Server'),
			icon: Platform.select({ ios: 'symbol:plus', android: 'ic_quickaction_add' })
		},
		{
			id: 'recent',
			title: recentRoomName ?? I18n.t('Recent_Rooms'),
			subtitle: recentRoomName ? I18n.t('Last_visited_room') : undefined,
			icon: Platform.select({
				ios: 'symbol:clock.arrow.trianglehead.counterclockwise.rotate.90',
				android: 'ic_quickaction_recent'
			})
		},
		{
			id: 'contact',
			title: Platform.select({ android: I18n.t('Contact_us'), ios: I18n.t('Something_Wrong?') }) ?? I18n.t('Contact_us'),
			subtitle: I18n.t('We_are_here_to_help'),
			icon: Platform.select({
				ios: 'symbol:envelope',
				android: 'ic_quickaction_contact'
			})
		}
	]);
}

export async function registerQuickActions() {
	if (registered) {
		return;
	}
	registered = true;

	await updateQuickActions();

	quickActionSubscription = QuickActions.addListener(action => {
		if (!action?.id) {
			return;
		}
		handleQuickAction(action.id);
	});

	appStateSubscription = AppState.addEventListener('change', async nextState => {
		if (nextState === 'active') {
			const nativeAction = await getRecentQuickAction();
			if (nativeAction) {
				InteractionManager.runAfterInteractions(() => {
					handleQuickAction(nativeAction);
				});
			}
		}
	});
}

export function unregisterQuickActions() {
	quickActionSubscription?.remove();
	appStateSubscription?.remove();
	quickActionSubscription = null;
	registered = false;
}

function handleQuickAction(id: string) {
	store.dispatch(
		quickActionHandle({
			action: id
		})
	);
}
