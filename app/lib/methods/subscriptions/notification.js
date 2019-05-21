import protectedFunction from '../helpers/protectedFunction';
import log from '../../../utils/log';
import store from '../../createStore';
import { notificationReceived } from '../../../actions/notification';

const removeListener = listener => listener.stop();

let notificationListener;

export default async function notification() {
	const handleNotificationReceived = protectedFunction((nReceived) => {
		const [, ev] = nReceived.fields.eventName.split('/');
		if (/notification/.test(ev)) {
			const [data] = nReceived.fields.args;
			store.dispatch(notificationReceived(data));
		}
	});

	notificationListener = this.sdk.onStreamData('stream-notify-user', handleNotificationReceived);

	const stop = () => {
		if (notificationListener) {
			notificationListener.then(removeListener);
			notificationListener = false;
		}
	};

	try {
		await this.sdk.subscribeNotifyUser();
	} catch (e) {
		log('subscribeRooms', e);
	}

	return {
		stop: () => stop()
	};
}
