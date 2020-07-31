import log from '../../../utils/log';
import store from '../../createStore';
import RocketChat from '../../rocketchat';
import {
	inquiryRequest,
	inquiryQueueAdd,
	inquiryQueueUpdate,
	inquiryQueueRemove
} from '../../../actions/inquiry';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let queueListener;

const streamTopic = 'stream-livechat-inquiry-queue-observer';

export default function subscribeInquiry() {
	const handleConnection = () => {
		store.dispatch(inquiryRequest());
	};

	const handleQueueMessageReceived = (ddpMessage) => {
		const [{ type, ...sub }] = ddpMessage.fields.args;

		// added can be ignored, since it is handled by 'changed' event
		if (/added/.test(type)) {
			return;
		}

		// if the sub isn't on the queue anymore
		if (sub.status !== 'queued') {
			// remove it from the queue
			store.dispatch(inquiryQueueRemove(sub._id));
			return;
		}

		const { queued } = store.getState().inquiry;
		// check if this sub is on the current queue
		const idx = queued.findIndex(item => item._id === sub._id);
		if (idx >= 0) {
			// if it is on the queue let's update
			store.dispatch(inquiryQueueUpdate(sub));
		} else {
			// if it is not on the queue let's add
			store.dispatch(inquiryQueueAdd(sub));
		}
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
		if (queueListener) {
			queueListener.then(removeListener);
			queueListener = false;
		}
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnection);
	disconnectedListener = this.sdk.onStreamData('close', handleConnection);
	queueListener = this.sdk.onStreamData(streamTopic, handleQueueMessageReceived);

	try {
		const { user } = store.getState().login;
		RocketChat.getAgentDepartments(user.id).then((result) => {
			if (result.success) {
				const { departments } = result;

				if (!departments.length || RocketChat.hasRole('livechat-manager')) {
					this.sdk.subscribe(streamTopic, 'public').catch(e => console.log(e));
				}

				const departmentIds = departments.map(({ departmentId }) => departmentId);
				departmentIds.forEach((departmentId) => {
					// subscribe to all departments of the agent
					this.sdk.subscribe(streamTopic, `department/${ departmentId }`).catch(e => console.log(e));
				});
			}
		});

		return {
			stop: () => stop()
		};
	} catch (e) {
		log(e);
		return Promise.reject();
	}
}
