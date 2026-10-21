import { groupConferenceMembers, nextRingingLapse, RINGING_WINDOW_MS } from '../groupConferenceMembers';

const NOW = Date.parse('2026-10-15T08:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

type TTestMember = {
	id: string;
	joined?: boolean;
	leftAt?: string;
	declined?: boolean;
	declinedAt?: string;
	ringingAt?: string;
};

const member = (id: string, rest: Omit<TTestMember, 'id'> = {}): TTestMember => ({ id, ...rest });
const ids = (members: TTestMember[]) => members.map(({ id }) => id);

describe('groupConferenceMembers', () => {
	it('puts whoever joined and has not left in the call', () => {
		const groups = groupConferenceMembers([member('ada', { joined: true }), member('bob', { joined: true })], NOW);

		expect(ids(groups.inCall)).toEqual(['ada', 'bob']);
	});

	it('moves someone who left out of the call', () => {
		const groups = groupConferenceMembers([member('ada', { joined: true, leftAt: ago(1000) })], NOW);

		expect(ids(groups.inCall)).toEqual([]);
		expect(ids(groups.notInCall)).toEqual(['ada']);
	});

	it('lists a member being rung now as waiting to join', () => {
		const groups = groupConferenceMembers([member('ada', { joined: false, ringingAt: ago(2000) })], NOW);

		expect(ids(groups.waiting)).toEqual(['ada']);
	});

	it('stops treating a ring as live once its window passed', () => {
		const groups = groupConferenceMembers([member('ada', { joined: false, ringingAt: ago(RINGING_WINDOW_MS + 1) })], NOW);

		expect(ids(groups.waiting)).toEqual([]);
		expect(ids(groups.notInCall)).toEqual(['ada']);
	});

	it('stops ringing the moment the member declines', () => {
		const groups = groupConferenceMembers(
			[member('ada', { joined: false, ringingAt: ago(4000), declined: true, declinedAt: ago(2000) })],
			NOW
		);

		expect(ids(groups.waiting)).toEqual([]);
		expect(ids(groups.notInCall)).toEqual(['ada']);
	});

	it('rings again after an earlier decline', () => {
		const groups = groupConferenceMembers(
			[member('ada', { joined: false, ringingAt: ago(1000), declined: true, declinedAt: ago(5000) })],
			NOW
		);

		expect(ids(groups.waiting)).toEqual(['ada']);
	});

	it('keeps a member who is both in the call and being rung in the call', () => {
		const groups = groupConferenceMembers([member('ada', { joined: true, ringingAt: ago(1000) })], NOW);

		expect(ids(groups.inCall)).toEqual(['ada']);
		expect(ids(groups.waiting)).toEqual([]);
	});

	it('keeps the order the Workspace gave within each group', () => {
		const groups = groupConferenceMembers(
			[member('c', { joined: true }), member('a', { joined: true }), member('b', { joined: true })],
			NOW
		);

		expect(ids(groups.inCall)).toEqual(['c', 'a', 'b']);
	});
});

describe('nextRingingLapse', () => {
	it('is when the earliest live ring runs out', () => {
		const lapse = nextRingingLapse(
			[member('ada', { joined: false, ringingAt: ago(2000) }), member('bob', { joined: false, ringingAt: ago(9000) })],
			NOW
		);

		expect(lapse).toBe(NOW - 9000 + RINGING_WINDOW_MS);
	});

	it('ignores rings that already lapsed, people who answered and people who were never rung', () => {
		const lapse = nextRingingLapse(
			[
				member('ada', { joined: false, ringingAt: ago(RINGING_WINDOW_MS + 1) }),
				member('bob', { joined: true, ringingAt: ago(1000) }),
				member('cleo', { joined: false })
			],
			NOW
		);

		expect(lapse).toBeUndefined();
	});

	it('ignores a ring the member declined', () => {
		const lapse = nextRingingLapse(
			[member('ada', { joined: false, ringingAt: ago(4000), declined: true, declinedAt: ago(2000) })],
			NOW
		);

		expect(lapse).toBeUndefined();
	});
});
