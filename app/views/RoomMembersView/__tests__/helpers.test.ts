import { groupMembersByRole, setMemberRole } from '../helpers';

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

type TMember = { _id: string; roles?: string[] };

describe('setMemberRole', () => {
	const moderator: TMember = { _id: '1', roles: ['moderator'] };
	const plain: TMember = { _id: '2' };

	it('adds the role to the member and leaves the others untouched', () => {
		const result = setMemberRole([moderator, plain], '2', 'owner', true);

		expect(result).toEqual([moderator, { _id: '2', roles: ['owner'] }]);
		expect(result[0]).toBe(moderator);
	});

	it('does not repeat a role the member already has', () => {
		expect(setMemberRole([moderator], '1', 'moderator', true)).toEqual([{ _id: '1', roles: ['moderator'] }]);
	});

	it('removes only the given role', () => {
		const member: TMember = { _id: '3', roles: ['owner', 'moderator'] };

		expect(setMemberRole([member], '3', 'owner', false)).toEqual([{ _id: '3', roles: ['moderator'] }]);
	});
});
