import sdk from '../../../lib/services/sdk';
import { IUser } from '../../../definitions';
import { compareServerVersion } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import subscribeInquiry from './subscriptions/inquiry';

export const isOmnichannelStatusAvailable = (user: IUser): boolean => user?.statusLivechat === 'available';

// RC 0.26.0
export const changeLivechatStatus = () => sdk.methodCallWrapper('livechat:changeLivechatStatus');

// RC 2.4.0
// @ts-ignore
export const getInquiriesQueued = (serverVersion: string) => {
	const url = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')
		? 'livechat/inquiries.queuedForUser'
		: 'livechat/inquiries.queued';
	return sdk.get(url);
};

// this inquiry is added to the db by the subscriptions stream
// and will be removed by the queue stream
// RC 2.4.0
export const takeInquiry = (inquiryId: string) => sdk.methodCallWrapper('livechat:takeInquiry', inquiryId);

// RC 4.26
export const takeResume = (roomId: string) => sdk.methodCallWrapper('livechat:resumeOnHold', roomId);

class Omnichannel {
	private inquirySub: { stop: () => void } | null;
	constructor() {
		this.inquirySub = null;
		EventEmitter.addEventListener('INQUIRY_SUBSCRIBE', this.subscribeInquiry);
		EventEmitter.addEventListener('INQUIRY_UNSUBSCRIBE', this.unsubscribeInquiry);
	}

	subscribeInquiry = async () => {
		console.log('[RCRN] Subscribing to inquiry');
		this.inquirySub = await subscribeInquiry();
	};

	unsubscribeInquiry = () => {
		if (this.inquirySub) {
			console.log('[RCRN] Unsubscribing from inquiry');
			this.inquirySub.stop();
			this.inquirySub = null;
		}
	};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const omnichannel = new Omnichannel();
