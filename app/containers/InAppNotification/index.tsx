import React, { memo, useEffect } from 'react';
import { Easing, Notifier, NotifierRoot } from 'react-native-notifier';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import NotifierComponent, { INotifierComponent } from './NotifierComponent';
import EventEmitter from '../../utils/events';
import Navigation from '../../lib/Navigation';
import { getActiveRoute } from '../../utils/navigation';
import { IApplicationState } from '../../definitions';
import { IRoom } from '../../reducers/room';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(
	({ rooms, appState }: { rooms: IRoom['rooms']; appState: string }) => {
		const show = (notification: INotifierComponent['notification']) => {
			if (appState !== 'foreground') {
				return;
			}

			const { payload } = notification;
			const state = Navigation.navigationRef.current?.getRootState();
			const route = getActiveRoute(state);
			if (payload.rid) {
				if (rooms.includes(payload.rid) || route?.name === 'JitsiMeetView') {
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
		}, [rooms]);

		return <NotifierRoot />;
	},
	(prevProps, nextProps) => dequal(prevProps.rooms, nextProps.rooms)
);

const mapStateToProps = (state: IApplicationState) => ({
	rooms: state.room.rooms,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
});

export default connect(mapStateToProps)(InAppNotification);
