import React, { memo, useEffect } from 'react';
import { Easing, Notifier, NotifierRoot } from 'react-native-notifier';
import { connect } from 'react-redux';

import NotifierComponent, { INotifierComponent } from './NotifierComponent';
import EventEmitter from '../../lib/methods/helpers/events';
import Navigation from '../../lib/navigation/appNavigation';
import { getActiveRoute } from '../../lib/methods/helpers/navigation';
import { IApplicationState } from '../../definitions';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(({ appState, subscribedRoom }: { appState: string; subscribedRoom: string }) => {
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

const mapStateToProps = (state: IApplicationState) => ({
	subscribedRoom: state.room.subscribedRoom,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
});

export default connect(mapStateToProps)(InAppNotification);
