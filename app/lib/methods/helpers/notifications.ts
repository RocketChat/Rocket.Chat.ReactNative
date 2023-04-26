import { ElementType } from 'react';
import { Easing, Notifier } from 'react-native-notifier';

export const showCustomNotification = (NotifierComponent: ElementType, notification: any, customTime?: number): void => {
	Notifier.showNotification({
		showEasing: Easing.inOut(Easing.quad),
		Component: NotifierComponent,
		componentProps: {
			notification
		},
		duration: customTime || 3000
	});
};

export const hideCustomNotification = () => {
	Notifier.hideNotification();
};
