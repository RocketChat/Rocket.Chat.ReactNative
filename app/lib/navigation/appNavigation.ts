import * as React from 'react';
import { CommonActions, NavigationContainerRef, StackActions } from '@react-navigation/native';

const navigationRef = React.createRef<NavigationContainerRef>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef | null> = React.createRef();

function navigate(name: string, params?: any) {
	navigationRef.current?.navigate(name, params);
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

function replace(name: string, params: any) {
	navigationRef.current?.dispatch(StackActions.replace(name, params));
}

export default {
	navigationRef,
	routeNameRef,
	navigate,
	back,
	replace
};
