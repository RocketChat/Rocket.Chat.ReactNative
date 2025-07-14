import * as React from 'react';
import { CommonActions, NavigationContainerRef, StackActions } from '@react-navigation/native';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = React.createRef<NavigationContainerRef<any>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<any> | null> = React.createRef();

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

function popTo(name: string) {
	navigationRef.current?.dispatch(StackActions.popTo(name));
}

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

export default {
	navigationRef,
	routeNameRef,
	navigate,
	push,
	back,
	replace,
	popTo,
	popToTop,
	dispatch,
	resetTo,
	getCurrentRoute,
	setParams
};
