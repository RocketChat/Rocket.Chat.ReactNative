import { getQuickRepliesLimits } from '../getQuickRepliesLimits';
import { DEFAULT_QUICK_REPLIES_MAX, DEFAULT_QUICK_REPLY_MAX_LENGTH, QUICK_REPLIES_LIMIT_CEILING } from '../constants';

const defaults = { max: DEFAULT_QUICK_REPLIES_MAX, maxLength: DEFAULT_QUICK_REPLY_MAX_LENGTH };

describe('getQuickRepliesLimits', () => {
	it('uses the defaults when the server sends no limits', () => {
		expect(getQuickRepliesLimits({})).toEqual(defaults);
	});

	it('uses the limits the server sends', () => {
		expect(getQuickRepliesLimits({ Apple_Watch_Quick_Actions_Max_Count: 4, Apple_Watch_Quick_Actions_Max_Length: 12 })).toEqual({
			max: 4,
			maxLength: 12
		});
	});

	it.each([0, -3, 2.5, NaN])('uses the default for the unusable value %p', value => {
		expect(
			getQuickRepliesLimits({ Apple_Watch_Quick_Actions_Max_Count: value, Apple_Watch_Quick_Actions_Max_Length: value })
		).toEqual(defaults);
	});

	it('caps limits above the ceiling', () => {
		expect(
			getQuickRepliesLimits({
				Apple_Watch_Quick_Actions_Max_Count: QUICK_REPLIES_LIMIT_CEILING + 1,
				Apple_Watch_Quick_Actions_Max_Length: 100000
			})
		).toEqual({ max: QUICK_REPLIES_LIMIT_CEILING, maxLength: QUICK_REPLIES_LIMIT_CEILING });
	});

	it('keeps a limit equal to the ceiling', () => {
		expect(getQuickRepliesLimits({ Apple_Watch_Quick_Actions_Max_Count: QUICK_REPLIES_LIMIT_CEILING })).toEqual({
			...defaults,
			max: QUICK_REPLIES_LIMIT_CEILING
		});
	});
});
