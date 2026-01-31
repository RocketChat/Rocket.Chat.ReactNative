import * as React from 'react';
import {
	CommonActions,
	type NavigationAction,
	type NavigationContainerRef,
	type NavigationState,
	type ParamListBase,
	StackActions
} from '@react-navigation/native';

import { type StackParamList } from '../../definitions/navigationTypes';

const navigationRef = React.createRef<NavigationContainerRef<StackParamList>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<StackParamList> | null> = React.createRef();

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
// This allows navigation to both top-level and nested routes. Params are typed when name is a keyof StackParamList.
function navigate<K extends keyof StackParamList | string>(
	name: K,
	params?: K extends keyof StackParamList ? StackParamList[K] : object
): void {
	const nav = navigationRef.current;
	if (nav) {
		(nav.navigate as (n: keyof StackParamList, p?: StackParamList[keyof StackParamList]) => void)(
			name as keyof StackParamList,
			params as StackParamList[keyof StackParamList]
		);
	}
}

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
function push<K extends keyof StackParamList | string>(
	name: K,
	params?: K extends keyof StackParamList ? StackParamList[K] : object
): void {
	navigationRef.current?.dispatch(
		StackActions.push(name as keyof StackParamList, params as StackParamList[keyof StackParamList])
	);
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
function replace<K extends keyof StackParamList | string>(
	name: K,
	params?: K extends keyof StackParamList ? StackParamList[K] : object
): void {
	navigationRef.current?.dispatch(
		StackActions.replace(name as keyof StackParamList, params as StackParamList[keyof StackParamList])
	);
}

// Pops to the first occurrence of the given route name, usually RoomView
// Note: name can be a nested route name (e.g., 'RoomView', 'DrawerNavigator') not just top-level routes
function popTo(name: keyof StackParamList | string) {
	navigationRef.current?.dispatch(StackActions.popTo(name as keyof StackParamList));
}

// Removes RoomView from the stack and leaves only RoomsListView open
function popToTop(isMasterDetail: boolean) {
	if (isMasterDetail) {
		popTo('DrawerNavigator');
		dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: 'RoomView' }]
			})
		);
	} else {
		dispatch(StackActions.popToTop());
	}
}

function popToRoom(isMasterDetail: boolean) {
	if (isMasterDetail) {
		popTo('DrawerNavigator');
	} else {
		popTo('RoomView');
	}
}

type DispatchAction =
	| NavigationAction
	| ((state: Readonly<NavigationState<ParamListBase>>) => NavigationAction);

function dispatch(action: DispatchAction) {
	navigationRef.current?.dispatch(action as Parameters<NavigationContainerRef<StackParamList>['dispatch']>[0]);
}

// Note: screen can be a nested route name (e.g., 'RoomView') not just top-level routes
function resetTo(screen: keyof StackParamList | string = 'RoomView') {
	navigationRef.current?.dispatch((state: Readonly<NavigationState<ParamListBase>>) => {
		const index = state.routes.findIndex((r: { name: string }) => r.name === screen);
		const routes = state.routes.slice(0, index + 1);

		return CommonActions.reset({
			...state,
			routes,
			index: routes.length - 1
		});
	});
}

function getCurrentRoute() {
	return navigationRef.current?.getCurrentRoute();
}

// Note: params can be for any route, including nested routes
function setParams(params: object) {
	navigationRef.current?.setParams(params);
}

export default {
	navigationRef,
	routeNameRef,
	navigate,
	push,
	back,
	replace,
	popTo,
	popToTop,
	popToRoom,
	dispatch,
	resetTo,
	getCurrentRoute,
	setParams
};
