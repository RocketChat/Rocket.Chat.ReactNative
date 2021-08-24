import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NotifierRoot, Notifier, Easing } from 'react-native-notifier';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import NotifierComponent from './NotifierComponent';
import EventEmitter from '../../utils/events';
import Navigation from '../../lib/Navigation';
import { getActiveRoute } from '../../utils/navigation';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(({ rooms, appState }) => {
	const show = (notification) => {
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
}, (prevProps, nextProps) => dequal(prevProps.rooms, nextProps.rooms));

const mapStateToProps = state => ({
	rooms: state.room.rooms,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
});

InAppNotification.propTypes = {
	rooms: PropTypes.array,
	appState: PropTypes.string
};

export default connect(mapStateToProps)(InAppNotification);
