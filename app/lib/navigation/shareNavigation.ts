import * as React from 'react';
import { type NavigationContainerRef } from '@react-navigation/native';

import { type ShareInsideStackParamList } from '../../definitions/navigationTypes';

const navigationRef = React.createRef<NavigationContainerRef<ShareInsideStackParamList>>();
const routeNameRef: React.MutableRefObject<NavigationContainerRef<ShareInsideStackParamList> | null> = React.createRef();

export default {
	navigationRef,
	routeNameRef
};
