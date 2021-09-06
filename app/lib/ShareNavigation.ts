import * as React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

const navigationRef = React.createRef<NavigationContainerRef>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef | null> = React.createRef();

export default {
	navigationRef,
	routeNameRef
};
