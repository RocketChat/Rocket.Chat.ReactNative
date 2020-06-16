import React from 'react';
import { NotifierRoot, Notifier, Easing } from 'react-native-notifier';

import NotifierComponent from './NotifierComponent';
import EventEmitter from '../../utils/events';
import Navigation from '../../lib/Navigation';
import { getActiveRoute } from '../../utils/navigation';

const ANIMATION_DURATION = 300;
const NOTIFICATION_DURATION = 3000;

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

class InAppNotification extends React.Component {
	componentDidMount() {
		EventEmitter.addEventListener(INAPP_NOTIFICATION_EMITTER, this.show);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(INAPP_NOTIFICATION_EMITTER);
	}

	show = (notification) => {
		const { payload } = notification;
		const state = Navigation.navigationRef.current.getRootState();
		const route = getActiveRoute(state);
		if (payload.rid) {
			if (route?.name === 'RoomView' && route.params?.rid === payload.rid) {
				return;
			}
			Notifier.showNotification({
				showAnimationDuration: ANIMATION_DURATION,
				hideAnimationDuration: ANIMATION_DURATION,
				duration: NOTIFICATION_DURATION,
				showEasing: Easing.inOut(Easing.quad),
				Component: NotifierComponent,
				componentProps: {
					notification
				}
			});
		}
	}

	render() {
		return (
			<NotifierRoot />
		);
	}
}

export default InAppNotification;
