import subscribeInquiry from './subscriptions/inquiry';
import RocketChat from '../../../lib/rocketchat';
import EventEmitter from '../../../utils/events';

export const isOmnichannelStatusAvailable = user => user?.statusLivechat === 'available';

// RC 0.26.0
export const changeLivechatStatus = () => RocketChat.methodCallWrapper('livechat:changeLivechatStatus');

// RC 2.4.0
export const getInquiriesQueued = () => RocketChat.sdk.get('livechat/inquiries.queued');

// this inquiry is added to the db by the subscriptions stream
// and will be removed by the queue stream
// RC 2.4.0
export const takeInquiry = inquiryId => RocketChat.methodCallWrapper('livechat:takeInquiry', inquiryId);

class Omnichannel {
	constructor() {
		this.inquirySub = null;
		EventEmitter.addEventListener('INQUIRY_SUBSCRIBE', this.subscribeInquiry);
		EventEmitter.addEventListener('INQUIRY_UNSUBSCRIBE', this.unsubscribeInquiry);
	}

	subscribeInquiry = async() => {
		console.log('[RCRN] Subscribing to inquiry');
		this.inquirySub = await subscribeInquiry();
	}

	unsubscribeInquiry = () => {
		if (this.inquirySub) {
			console.log('[RCRN] Unsubscribing from inquiry');
			this.inquirySub.stop();
			this.inquirySub = null;
		}
	}
}

// eslint-disable-next-line no-unused-vars
const omnichannel = new Omnichannel();
