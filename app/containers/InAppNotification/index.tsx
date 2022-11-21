import React, { memo, useEffect } from 'react';
import { Easing, Notifier, NotifierRoot } from 'react-native-notifier';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import NotifierComponent, { INotifierComponent } from './NotifierComponent';
import EventEmitter from '../../lib/methods/helpers/events';
import Navigation from '../../lib/navigation/appNavigation';
import { getActiveRoute } from '../../lib/methods/helpers/navigation';
import { IApplicationState } from '../../definitions';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(
	({ appState, roomSubscribed }: { appState: string; roomSubscribed: string }) => {
		const show = (notification: INotifierComponent['notification']) => {
			if (appState !== 'foreground') {
				return;
			}

			const { payload } = notification;
			const state = Navigation.navigationRef.current?.getRootState();
			const route = getActiveRoute(state);
			if (payload.rid) {
				if (payload.rid === roomSubscribed || route?.name === 'JitsiMeetView') {
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
		}, [roomSubscribed]);

		return <NotifierRoot />;
	},
	(prevProps, nextProps) => dequal(prevProps.roomSubscribed, nextProps.roomSubscribed)
);

const mapStateToProps = (state: IApplicationState) => ({
	roomSubscribed: state.room.subscribed,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
});

export default connect(mapStateToProps)(InAppNotification);
