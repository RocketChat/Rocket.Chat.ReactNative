// import log from '../../../utils/log';
// import store from '../../createStore';
// import E2E from '../../encryption/e2e';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let e2eKeyRequest;

const streamTopic = 'stream-notify-user';
// const streamEvent = 'e2eKeyRequest';

export default function subscribeEncryption() {
	const handleConnection = () => {
		console.log('connected');
	};

	const handleE2EKeyRequestReceived = () => {
		// const data = ddpMessage.fields.args;
		// E2E.provideRoomKeyToUser(keyId, roomId);
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
		if (e2eKeyRequest) {
			e2eKeyRequest.then(removeListener);
			e2eKeyRequest = false;
		}
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnection);
	disconnectedListener = this.sdk.onStreamData('close', handleConnection);
	// TODO: Can we receive only stream data about a specific event?
	e2eKeyRequest = this.sdk.onStreamData(streamTopic, handleE2EKeyRequestReceived);

	try {
		// const { user: { id: userId } } = store.getState().login;
		// this.subscribe('stream-notify-user', `${ userId }/${ streamEvent }`).catch(e => console.log(e));

		return {
			stop: () => stop()
		};
	// eslint-disable-next-line no-unreachable
	} catch (e) {
		// log(e);
		// return Promise.reject();
	}
}
