import { groupMembersByRole } from '../groupMembersByRole';

describe('groupMembersByRole', () => {
	it.each([
		[['owner'], 'owner'],
		[['leader'], 'leader'],
		[['moderator'], 'moderator'],
		[['owner', 'leader'], 'owner'],
		[['owner', 'moderator'], 'owner'],
		[['leader', 'moderator'], 'leader'],
		[[], 'member'],
		[undefined, 'member']
	])('places a member with roles %p under %s', (roles, group) => {
		const member = { _id: '1', roles };

		expect(groupMembersByRole([member])).toEqual([{ key: group, data: [member] }]);
	});

	it('returns the groups that have members, in role order', () => {
		const owner = { _id: '1', roles: ['owner'] };
		const moderatorA = { _id: '3', roles: ['moderator'] };
		const moderatorB = { _id: '4', roles: ['moderator'] };
		const member: { _id: string; roles?: string[] } = { _id: '5' };

		expect(groupMembersByRole([owner, moderatorA, moderatorB, member])).toEqual([
			{ key: 'owner', data: [owner] },
			{ key: 'moderator', data: [moderatorA, moderatorB] },
			{ key: 'member', data: [member] }
		]);
	});

	it('keeps one group per role when members are out of order', () => {
		const owner = { _id: '1', roles: ['owner'] };
		const memberA: { _id: string; roles?: string[] } = { _id: '2' };
		const memberB: { _id: string; roles?: string[] } = { _id: '3' };

		expect(groupMembersByRole([memberA, owner, memberB])).toEqual([
			{ key: 'owner', data: [owner] },
			{ key: 'member', data: [memberA, memberB] }
		]);
	});

	it('returns no groups when there are no members', () => {
		expect(groupMembersByRole([])).toEqual([]);
	});
});
