import log from '../../../utils/log';
import store from '../../createStore';
import { notifyAllRequest } from '../../../actions/notifyAll';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;

export default function subscribeNotifyAll() {
	const handleConnection = () => {
		store.dispatch(notifyAllRequest());
	};

	const handleNotifyAllMessageReceived = (ddpMessage) => {
		alert(JSON.stringify(ddpMessage));
	};

	const stop = () => {
		if (connectedListener) {
			connectedListener.then(removeListener);
			connectedListener = false;
		}
		if (disconnectedListener) {
			disconnectedListener.then(removeListener);
			disconnectedListener = false;
		}
		if (streamListener) {
			streamListener.then(removeListener);
			streamListener = false;
		}
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnection);
	disconnectedListener = this.sdk.onStreamData('close', handleConnection);
	streamListener = this.sdk.onStreamData('stream-notify-all', handleNotifyAllMessageReceived);

	try {
		this.sdk.subscribeNotifyAll().catch(e => console.log(e));

		return {
			stop: () => stop()
		};
	} catch (e) {
		log(e);
		return Promise.reject();
	}
}
