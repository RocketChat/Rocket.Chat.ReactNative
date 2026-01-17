import * as QuickActions from 'expo-quick-actions';
import { InteractionManager, AppState, Platform } from 'react-native';

import store from '../store';
import { getRecentQuickAction } from './getRecentQuickAction';
import { quickActionHandle } from '../../actions/quickActions';
import { type IRecentRoomsStore } from '../../reducers/rooms';
import { getServersList } from '../methods/getServerList';
import I18n from '../../i18n';

let registered = false;

let quickActionSubscription: { remove(): void } | null = null;
let appStateSubscription: { remove(): void } | null = null;

export async function updateQuickActions({ recentRooms }: { recentRooms: IRecentRoomsStore[] } = { recentRooms: [] }) {
	const serverList = (await getServersList()).map(server => server._raw.id);
	const recentRoomQuickActions: QuickActions.Action[] = recentRooms
		.map(room => {
			if (!room.server) return null;
			if (!serverList.includes(room.server)) return null;

			return {
				id: `recent/${encodeURIComponent(room.server)}/${room.rid}`,
				title: room.name,
				subtitle: room.server,
				icon: Platform.select({
					ios: 'symbol:clock.arrow.trianglehead.counterclockwise.rotate.90',
					android: 'ic_quickaction_recent',
					default: undefined
				})
			} as QuickActions.Action;
		})
		.filter(item => item !== null)
		.reverse();

	const quickActionItems = [
		...recentRoomQuickActions,
		{
			id: 'contact',
			title: Platform.select({ android: I18n.t('Contact_us'), ios: I18n.t('Something_Wrong?') }) ?? I18n.t('Contact_us'),
			subtitle: I18n.t('We_are_here_to_help'),
			icon: Platform.select({
				ios: 'symbol:envelope',
				android: 'ic_quickaction_contact'
			})
		}
	];

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
