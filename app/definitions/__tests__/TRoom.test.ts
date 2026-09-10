import { isPreviewRoom, isSubscriptionModel, type TPreviewRoom } from '../TRoom';
import { type TSubscriptionModel } from '../ISubscription';

const subscription = { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general' } as TSubscriptionModel;
const preview: TPreviewRoom = { rid: 'rid-1', t: 'c', name: 'general' };

describe('isSubscriptionModel', () => {
	it('returns true for a Subscription model', () => {
		expect(isSubscriptionModel(subscription)).toBe(true);
	});

	it('returns false for a preview room', () => {
		expect(isSubscriptionModel(preview)).toBe(false);
	});
});

describe('isPreviewRoom', () => {
	it('returns true for a preview room', () => {
		expect(isPreviewRoom(preview)).toBe(true);
	});

	it('returns false for a Subscription model', () => {
		expect(isPreviewRoom(subscription)).toBe(false);
	});
});
