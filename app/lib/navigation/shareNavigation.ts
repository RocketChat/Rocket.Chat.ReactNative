import type { NavigationContainerRef } from '@react-navigation/native';
import { createRef, type RefObject } from 'react';

// TODO: we need change this any to the correctly types from our stacks
const navigationRef = createRef<NavigationContainerRef<any>>();
const routeNameRef: RefObject<NavigationContainerRef<any> | null> = createRef();

export default {
	navigationRef,
	routeNameRef
};
