import { getMemberRoleGroup, groupMembersByRole } from '../groupMembersByRole';

describe('getMemberRoleGroup', () => {
	it.each([
		[['owner'], 'owner'],
		[['leader'], 'leader'],
		[['moderator'], 'moderator'],
		[['owner', 'leader'], 'owner'],
		[['owner', 'moderator'], 'owner'],
		[['leader', 'moderator'], 'leader'],
		[[], 'member'],
		[undefined, 'member']
	])('maps %p to %s', (roles, group) => {
		expect(getMemberRoleGroup(roles)).toBe(group);
	});
});

describe('groupMembersByRole', () => {
	it('returns every role group, in role order, empty when no member has that role', () => {
		const owner = { _id: '1', roles: ['owner'] };
		const moderatorA = { _id: '3', roles: ['moderator'] };
		const moderatorB = { _id: '4', roles: ['moderator'] };
		const member: { _id: string; roles?: string[] } = { _id: '5' };

		expect(groupMembersByRole([owner, moderatorA, moderatorB, member])).toEqual([
			{ key: 'owner', data: [owner] },
			{ key: 'leader', data: [] },
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
			{ key: 'leader', data: [] },
			{ key: 'moderator', data: [] },
			{ key: 'member', data: [memberA, memberB] }
		]);
	});
});
