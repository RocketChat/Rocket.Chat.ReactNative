import { SubscriptionType } from '~/definitions';
import { filterRoomsByTitle } from '../useCategoryRoomCandidates';

const general = { rid: 'general', title: 'general', avatar: 'general', t: SubscriptionType.CHANNEL };
const designReviews = { rid: 'design-reviews', title: 'Design reviews', avatar: 'design-reviews', t: SubscriptionType.GROUP };

describe('filterRoomsByTitle', () => {
	it('returns every room for a blank search', () => {
		expect(filterRoomsByTitle([general, designReviews], '  ')).toEqual([general, designReviews]);
	});

	it('matches part of the title regardless of case', () => {
		expect(filterRoomsByTitle([general, designReviews], 'REVIEW')).toEqual([designReviews]);
	});
});
