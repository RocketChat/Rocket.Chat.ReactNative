const { groupIosShards } = require('../group-ios-shards');

describe('groupIosShards', () => {
	it('preserves every selected shard and runs shard 9 on a small device', () => {
		const selected = Array.from({ length: 9 }, (_, index) => index + 1);
		const jobs = groupIosShards(selected);
		expect(jobs.flatMap(({ shards }) => shards.split(',').map(Number)).sort((a, b) => a - b)).toEqual(selected);
		expect(jobs.find(({ shards }) => shards.split(',').includes('9')).deviceProfile).toBe('small');
	});

	it('keeps the device requirement when filtering a combined job', () => {
		expect(groupIosShards([9])).toEqual([{ shards: '9', deviceProfile: 'small' }]);
		expect(groupIosShards([1, 9])).toEqual([
			{ shards: '9', deviceProfile: 'small' },
			{ shards: '1', deviceProfile: 'large' }
		]);
	});

	it('omits empty groups', () => {
		expect(groupIosShards([])).toEqual([]);
	});
});
