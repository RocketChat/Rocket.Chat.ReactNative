/* eslint-disable react/prop-types */
import React, { memo, useEffect, useRef } from 'react';
import { NotifierRoot, Notifier, Easing } from 'react-native-notifier';
import { connect } from 'react-redux';
import isEqual from 'deep-equal';

import NotifierComponent from './NotifierComponent';
import EventEmitter from '../../utils/events';
import Navigation from '../../lib/Navigation';
import { getActiveRoute } from '../../utils/navigation';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

const InAppNotification = memo(({ rooms }) => {
	const roomsRef = useRef(rooms);
	const show = (notification) => {
		const { payload } = notification;
		const state = Navigation.navigationRef.current?.getRootState();
		const route = getActiveRoute(state);
		if (payload.rid) {
			if (roomsRef?.current.includes(payload.rid) || route?.name === 'JitsiMeetView') {
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
		if (!isEqual(rooms, roomsRef?.current)) {
			roomsRef.current = rooms;
		}
	}, [rooms]);

	useEffect(() => {
		EventEmitter.addEventListener(INAPP_NOTIFICATION_EMITTER, show);
		return () => {
			EventEmitter.removeListener(INAPP_NOTIFICATION_EMITTER);
		};
	}, []);

	return <NotifierRoot />;
});

const mapStateToProps = state => ({
	rooms: state.room.rooms
});

export default connect(mapStateToProps)(InAppNotification);
