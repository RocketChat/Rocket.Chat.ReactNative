import RocketChat from '../../../lib/rocketchat';

export const isOmnichannelStatusAvailable = user => user?.statusLivechat === 'available';

// RC 0.26.0
export const changeLivechatStatus = () => RocketChat.methodCallWrapper('livechat:changeLivechatStatus');

// RC 2.4.0
export const getInquiriesQueued = () => RocketChat.sdk.get('livechat/inquiries.queued');

// this inquiry is added to the db by the subscriptions stream
// and will be removed by the queue stream
// RC 2.4.0
export const takeInquiry = inquiryId => RocketChat.methodCallWrapper('livechat:takeInquiry', inquiryId);
