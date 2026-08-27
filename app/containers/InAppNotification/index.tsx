import { memo, useEffect, type ElementType } from 'react';
import { Easing, Notifier, NotifierRoot } from 'react-native-notifier';
import { useDispatch } from 'react-redux';
import { AccessibilityInfo } from 'react-native';

import NotifierComponent, { type INotifierComponent } from './NotifierComponent';
import EventEmitter from '../../lib/methods/helpers/events';
import Navigation from '../../lib/navigation/appNavigation';
import { getActiveRoute } from '../../lib/methods/helpers/navigation';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { setInAppFeedback } from '../../actions/inAppFeedback';
import I18n from '../../i18n';

export const INAPP_NOTIFICATION_EMITTER = 'NotificationInApp';

type INotification = INotifierComponent['notification'] & {
	customComponent?: ElementType;
	customTime?: number;
	customNotification?: boolean;
	hideOnPress?: boolean;
	swipeEnabled?: boolean;
};

const announceForAccessibility = ({ payload }: INotification) => {
	if (!payload?.name || !payload?.message) return;

	AccessibilityInfo.announceForAccessibility(
		I18n.t('A11y_in_app_notification', {
			name: payload.name || payload.sender?.username || '',
			message: payload.message.message || payload.message.msg || ''
		})
	);
};

const showNotification = (notification: INotification) => {
	Notifier.showNotification({
		showEasing: Easing.inOut(Easing.quad),
		Component: notification.customComponent || NotifierComponent,
		componentProps: {
			notification
		},
		duration: notification.customTime || (process.env.RUNNING_E2E_TESTS ? 5000 : 3000), // default 3s,
		// our components handle their own presses; the library's press wrapper swallows taps on them
		hideOnPress: notification.hideOnPress ?? false,
		swipeEnabled: notification.swipeEnabled ?? true
	});
};

const isSuppressed = (messageType?: string) => {
	const route = getActiveRoute(Navigation.navigationRef.current?.getRootState());
	return route?.name === 'JitsiMeetView' || messageType === 'videoconf';
};

const InAppNotification = memo(() => {
	const { appState, subscribedRoom } = useAppSelector(state => ({
		subscribedRoom: state.room.subscribedRoom,
		appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
	}));

	const dispatch = useDispatch();

	const show = (notification: INotification) => {
		if (appState !== 'foreground') return;

		const { payload } = notification;
		if (!payload?.rid && !notification.customNotification) return;

		if (isSuppressed(payload?.message?.t)) return;

		if (payload?.rid === subscribedRoom) {
			dispatch(setInAppFeedback(payload._id));
			return;
		}

		announceForAccessibility(notification);
		showNotification(notification);
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
