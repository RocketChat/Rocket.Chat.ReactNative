import { TSubscriptionModel } from '../../../definitions';

export const filterIsUnread = (s: TSubscriptionModel) => (s.alert || s.unread) && !s.hideUnreadStatus;
export const filterIsFavorite = (s: TSubscriptionModel) => s.f;
export const filterIsOmnichannel = (s: TSubscriptionModel) => s.t === 'l';
export const filterIsTeam = (s: TSubscriptionModel) => s.teamMain;
export const filterIsDiscussion = (s: TSubscriptionModel) => s.prid;
