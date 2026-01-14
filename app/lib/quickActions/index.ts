import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState, Platform } from 'react-native';

import store from '../store';
import { getRecentQuickAction } from './getRecentQuickAction';
import { quickActionHandle } from '../../actions/quickActions';
import I18n from '../../i18n';
import { IRecentRoomsStore } from 'reducers/rooms';

let registered = false;

let quickActionSubscription: { remove(): void } | null = null;
let appStateSubscription: { remove(): void } | null = null;

export async function updateQuickActions({ recentRooms }: { recentRooms: IRecentRoomsStore[] } = { recentRooms: [] }) {
	const quickActionItems: QuickActions.Action[] = recentRooms
		.map(room => ({
			id: `recent/${room.rid}`,
			title: room.name,
			icon: Platform.select({
				ios: 'symbol:clock.arrow.trianglehead.counterclockwise.rotate.90',
				android: 'ic_quickaction_recent'
			})
		}))
		.reverse();
	await QuickActions.setItems(quickActionItems);
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
