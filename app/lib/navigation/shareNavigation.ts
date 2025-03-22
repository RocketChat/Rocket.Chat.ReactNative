import * as React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = React.createRef<NavigationContainerRef<any>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<any> | null> = React.createRef();

export default {
	navigationRef,
	routeNameRef
};
