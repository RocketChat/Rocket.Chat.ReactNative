import * as React from 'react';
import { CommonActions, type NavigationContainerRef, StackActions } from '@react-navigation/native';

import { type StackParamList } from '../../definitions/navigationTypes';

const navigationRef = React.createRef<NavigationContainerRef<StackParamList>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<StackParamList> | null> = React.createRef();

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
// This allows navigation to both top-level and nested routes
function navigate(name: keyof StackParamList | string, params?: any) {
	navigationRef.current?.navigate(name as any, params);
}

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
function push(name: keyof StackParamList | string, params?: any) {
	navigationRef.current?.dispatch(StackActions.push(name as any, params));
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

// Note: name can be a top-level route (keyof StackParamList) or nested route (string)
function replace(name: keyof StackParamList | string, params?: any) {
	navigationRef.current?.dispatch(StackActions.replace(name as any, params));
}

// Pops to the first occurrence of the given route name, usually RoomView
// Note: name can be a nested route name (e.g., 'RoomView', 'DrawerNavigator') not just top-level routes
function popTo(name: keyof StackParamList | string) {
	navigationRef.current?.dispatch(StackActions.popTo(name as any));
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

function dispatch(params: any) {
	navigationRef.current?.dispatch(params);
}

// Note: screen can be a nested route name (e.g., 'RoomView') not just top-level routes
function resetTo(screen: keyof StackParamList | string = 'RoomView') {
	navigationRef.current?.dispatch((state: any) => {
		const index = state.routes.findIndex((r: any) => r.name === screen);
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
function setParams(params: any) {
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
