import { NativeModules, DeviceEventEmitter } from 'react-native';
const SNModule = NativeModules.SocketNotificationsModule;

let notificationOpenedListener;

export class SocketNotificationsModule {

    static setNotificationOpenedListener(listener) {
        notificationOpenedListener = DeviceEventEmitter.addListener('socketNotificationOpened', (notification) => listener(new NotificationAndroid(notification)));
    }

    static getInitialNotification() {
        return SNModule.getInitialNotification();
    }

    static invalidateNotifications() {
        SNModule.invalidateNotifications();
    }
}

export class NotificationAndroid {

    constructor(notification) {
        this.data = notification;
    }

    getData() {
        return this.data;
    }
}
