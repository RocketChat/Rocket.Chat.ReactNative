import { NavigationActions } from 'react-navigation';

const config = {};

export function setNavigator(nav) {
	if (nav) {
		config.navigator = nav;
	}
}

export function navigate(routeName, params) {
	if (config.navigator && routeName) {
		const action = NavigationActions.navigate({ key: routeName, routeName, params });
		config.navigator.dispatch(action);
	}
}

export function goBack() {
	if (config.navigator) {
		const action = NavigationActions.back({});
		config.navigator.dispatch(action);
	}
}

export function goRoomsList() {
	if (config.navigator) {
		const action = NavigationActions.reset({
			index: 0,
			actions: [NavigationActions.navigate({ key: 'RoomsList', routeName: 'RoomsList' })]
		});
		config.navigator.dispatch(action);
	}
}

export function goRoom({ rid, name }, counter = 0) {
	// about counter: we can call this method before navigator be set. so we have to wait, if we tried a lot, we give up ...
	if (!rid || counter > 10) {
		return;
	}
	if (!config.navigator) {
		return setTimeout(() => goRoom({ rid, name }, counter + 1), 100);
	}

	const action = NavigationActions.reset({
		index: 1,
		actions: [
			NavigationActions.navigate({ key: 'RoomsList', routeName: 'RoomsList' }),
			NavigationActions.navigate({ key: `Room-${ rid }`, routeName: 'Room', params: { room: { rid, name }, rid, name } })
		]
	});
	config.navigator.dispatch(action);
}

export function dispatch(action) {
	if (config.navigator) {
		config.navigator.dispatch(action);
	}
}
