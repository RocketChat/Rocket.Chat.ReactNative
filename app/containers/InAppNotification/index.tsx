import React, { memo, useEffect } from 'react';
import { Easing, Notifier, NotifierRoot } from 'react-native-notifier';

import NotifierComponent, { INotifierComponent } from './NotifierComponent';
import EventEmitter from '../../lib/methods/helpers/events';
import Navigation from '../../lib/navigation/appNavigation';
import { getActiveRoute } from '../../lib/methods/helpers/navigation';
import { useAppSelector } from '../../lib/hooks';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(() => {
	const { appState, subscribedRoom } = useAppSelector(state => ({
		subscribedRoom: state.room.subscribedRoom,
		appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
	}));

	const show = (notification: INotifierComponent['notification']) => {
		if (appState !== 'foreground') {
			return;
		}

		const { payload } = notification;
		const state = Navigation.navigationRef.current?.getRootState();
		const route = getActiveRoute(state);
		if (payload.rid) {
			if (payload.rid === subscribedRoom || route?.name === 'JitsiMeetView') {
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
		const listener = EventEmitter.addEventListener(INAPP_NOTIFICATION_EMITTER, show);
		return () => {
			EventEmitter.removeListener(INAPP_NOTIFICATION_EMITTER, listener);
		};
	}, [subscribedRoom, appState]);

	return <NotifierRoot />;
});

export default InAppNotification;
