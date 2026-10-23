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
	it('returns an empty list for no members', () => {
		expect(groupMembersByRole([])).toEqual([]);
	});

	it('inserts a header before each role group', () => {
		const owner = { _id: '1', roles: ['owner'] };
		const leader = { _id: '2', roles: ['leader'] };
		const moderatorA = { _id: '3', roles: ['moderator'] };
		const moderatorB = { _id: '4', roles: ['moderator'] };
		const member: { _id: string; roles?: string[] } = { _id: '5' };

		expect(groupMembersByRole([owner, leader, moderatorA, moderatorB, member])).toEqual([
			{ type: 'header', group: 'owner' },
			{ type: 'member', member: owner },
			{ type: 'header', group: 'leader' },
			{ type: 'member', member: leader },
			{ type: 'header', group: 'moderator' },
			{ type: 'member', member: moderatorA },
			{ type: 'member', member: moderatorB },
			{ type: 'header', group: 'member' },
			{ type: 'member', member }
		]);
	});
});
