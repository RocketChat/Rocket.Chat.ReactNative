import React, { memo, useEffect } from 'react';
import { NotifierRoot, Notifier, Easing } from 'react-native-notifier';

import NotifierComponent from './NotifierComponent';
import EventEmitter from '../../utils/events';
import Navigation from '../../lib/Navigation';
import { getActiveRoute } from '../../utils/navigation';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(() => {
	const show = (notification) => {
		const { payload } = notification;
		const state = Navigation.navigationRef.current?.getRootState();
		const route = getActiveRoute(state);
		if (payload.rid) {
			if ((route?.name === 'RoomView' && route.params?.rid === payload.rid) || route?.name === 'JitsiMeetView') {
				return;
			}
			Notifier.showNotification({
				showEasing: Easing.inOut(Easing.quad),
				Component: NotifierComponent,
				componentProps: {
					notification
				}
			});
		}
	};

	useEffect(() => {
		EventEmitter.addEventListener(INAPP_NOTIFICATION_EMITTER, show);
		return () => {
			EventEmitter.removeListener(INAPP_NOTIFICATION_EMITTER);
		};
	}, []);

	return <NotifierRoot />;
});

export default InAppNotification;
