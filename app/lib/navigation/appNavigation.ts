import * as React from 'react';
import { CommonActions, NavigationContainerRef, StackActions } from '@react-navigation/native';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = React.createRef<NavigationContainerRef<any>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<any> | null> = React.createRef();

function navigate(name: string, params?: any) {
	navigationRef.current?.navigate(name, params);
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

function replace(name: string, params: any) {
	navigationRef.current?.dispatch(StackActions.replace(name, params));
}

function popToTop() {
	navigationRef.current?.dispatch(StackActions.popToTop());
}

function dispatch(params: any) {
	navigationRef.current?.dispatch(params);
}

export default {
	navigationRef,
	routeNameRef,
	navigate,
	back,
	replace,
	popToTop,
	dispatch
};
