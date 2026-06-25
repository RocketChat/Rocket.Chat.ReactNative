import { createRef, type MutableRefObject } from 'react';
import { type NavigationContainerRef } from '@react-navigation/native';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = createRef<NavigationContainerRef<any>>();
const routeNameRef: MutableRefObject<NavigationContainerRef<any> | null> = createRef();

export default {
	navigationRef,
	routeNameRef
};
