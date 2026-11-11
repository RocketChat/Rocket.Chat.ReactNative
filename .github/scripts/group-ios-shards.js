const groups = [
	{ shards: [3, 9], deviceProfile: 'small' },
	{ shards: [1, 8], deviceProfile: 'large' },
	{ shards: [2, 5], deviceProfile: 'large' },
	{ shards: [4, 6], deviceProfile: 'large' },
	{ shards: [7], deviceProfile: 'large' }
];

const groupIosShards = selected =>
	groups
		.map(({ shards, deviceProfile }) => ({ shards: shards.filter(shard => selected.includes(shard)).join(','), deviceProfile }))
		.filter(({ shards }) => shards);

module.exports = { groupIosShards };

if (require.main === module) process.stdout.write(JSON.stringify(groupIosShards(JSON.parse(process.env.SHARDS))));
