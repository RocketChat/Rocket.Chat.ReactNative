import { createRef, type MutableRefObject } from 'react';
import { CommonActions, type NavigationContainerRef, StackActions } from '@react-navigation/native';

import { emitter } from '../methods/helpers';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = createRef<NavigationContainerRef<any>>();
const routeNameRef: MutableRefObject<NavigationContainerRef<any> | null> = createRef();

function navigate(name: string, params?: any) {
	navigationRef.current?.navigate(name, params);
}

function push(name: string, params?: any) {
	navigationRef.current?.dispatch(StackActions.push(name, params));
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

function replace(name: string, params: any) {
	navigationRef.current?.dispatch(StackActions.replace(name, params));
}

// Pops to the first occurrence of the given route name, usually RoomView
function popTo(name: string, params?: any, options?: { merge?: boolean }) {
	navigationRef.current?.dispatch(StackActions.popTo(name, params, options));
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
		// merge keeps the retained RoomView's existing params instead of replacing them with undefined
		popTo('RoomView', undefined, { merge: true });
	}
}

function dispatch(params: any) {
	navigationRef.current?.dispatch(params);
}

function resetTo(screen = 'RoomView') {
	navigationRef.current?.dispatch(state => {
		const index = state.routes.findIndex(r => r.name === screen);
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

function setParams(params: any) {
	navigationRef.current?.setParams(params);
}

export function waitForNavigationReady(): Promise<void> {
	if (navigationRef.current) {
		return Promise.resolve();
	}
	return new Promise(resolve => {
		const listener = () => {
			emitter.off('navigationReady', listener);
			resolve();
		};
		emitter.on('navigationReady', listener);
	});
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
