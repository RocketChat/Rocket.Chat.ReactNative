import Subscription from '../Subscription';

// RoomStore's field selectors depend on an unchanged @json field returning the same reference
// across observe() emits; that stability comes from WatermelonDB's `{ memo: true }` option.
const makeRecord = (raw: Record<string, unknown>) => {
	const record = Object.create(Subscription.prototype);
	record._raw = raw;
	return record;
};

describe.each([
	['tunread', 'tunread', JSON.stringify(['1', '2']), JSON.stringify(['1', '2', '3'])],
	['tunreadUser', 'tunread_user', JSON.stringify(['1']), JSON.stringify(['1', '2'])],
	['tunreadGroup', 'tunread_group', JSON.stringify(['1']), JSON.stringify(['1', '2'])],
	['visitor', 'visitor', JSON.stringify({ status: 'online' }), JSON.stringify({ status: 'away' })],
	['source', 'source', JSON.stringify({ type: 'app' }), JSON.stringify({ type: 'widget' })],
	[
		'abacAttributes',
		'abac_attributes',
		JSON.stringify([{ key: 'k', values: ['v'] }]),
		JSON.stringify([{ key: 'k', values: ['v', 'w'] }])
	],
	['ignored', 'ignored', JSON.stringify(['uid-1']), JSON.stringify(['uid-1', 'uid-2'])],
	['lastMessage', 'last_message', JSON.stringify({ msg: 'hi' }), JSON.stringify({ msg: 'bye' })]
])('Subscription %s @json memo', (field, column, rawValue, changedRawValue) => {
	it('returns the identical reference on repeated reads', () => {
		const record = makeRecord({ [column]: rawValue });

		expect(record[field]).toBe(record[field]);
	});

	it('returns a new reference after the raw column value changes', () => {
		const record = makeRecord({ [column]: rawValue });

		const before = record[field];
		record._raw[column] = changedRawValue;
		const after = record[field];

		expect(after).not.toBe(before);
	});

	it('keeps the same reference when an unrelated column changes', () => {
		const record = makeRecord({ [column]: rawValue, unread: 0 });

		const before = record[field];
		record._raw.unread = 1;
		const after = record[field];

		expect(after).toBe(before);
	});
});
