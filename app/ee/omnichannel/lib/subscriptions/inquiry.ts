import log from '../../../../lib/methods/helpers/log';
import { store } from '../../../../lib/store/auxStore';
import { inquiryQueueAdd, inquiryQueueRemove, inquiryQueueUpdate, inquiryRequest } from '../../actions/inquiry';
import sdk from '../../../../lib/services/sdk';
import { IOmnichannelRoom } from '../../../../definitions';
import { hasRole } from '../../../../lib/methods/helpers';
import { Services } from '../../../../lib/services';

interface IArgsQueueOmnichannel extends IOmnichannelRoom {
	type: string;
}

interface IDdpMessage {
	msg: string;
	collection: string;
	id: string;
	fields: {
		eventName: string;
		args: IArgsQueueOmnichannel[];
	};
}

const removeListener = (listener: any) => listener.stop();

let connectedListener: any;
let queueListener: any;

const streamTopic = 'stream-livechat-inquiry-queue-observer';

export default function subscribeInquiry() {
	const handleConnection = () => {
		store.dispatch(inquiryRequest());
	};

	const handleQueueMessageReceived = (ddpMessage: IDdpMessage) => {
		const [{ type, ...sub }] = ddpMessage.fields.args;

		// added can be ignored, since it is handled by 'changed' event
		if (/added/.test(type)) {
			return;
		}

		// if the sub isn't on the queue anymore
		if (sub.status !== 'queued') {
			// remove it from the queue
			if (sub._id) {
				store.dispatch(inquiryQueueRemove(sub._id));
			}
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
		if (queueListener) {
			queueListener.then(removeListener);
			queueListener = false;
		}
	};

	connectedListener = sdk.onStreamData('connected', handleConnection);
	queueListener = sdk.onStreamData(streamTopic, handleQueueMessageReceived);

	try {
		const { user } = store.getState().login;

		if (!user.id) {
			throw new Error('inquiry: @subscribeInquiry user.id not found');
		}

		Services.getAgentDepartments(user.id).then(result => {
			if (result.success) {
				const { departments } = result;

				if (!departments.length || hasRole('livechat-manager')) {
					sdk.subscribe(streamTopic, 'public').catch((e: unknown) => console.log(e));
				}

				const departmentIds = departments.map(({ departmentId }) => departmentId);
				departmentIds.forEach(departmentId => {
					// subscribe to all departments of the agent
					sdk.subscribe(streamTopic, `department/${departmentId}`).catch((e: unknown) => console.log(e));
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
