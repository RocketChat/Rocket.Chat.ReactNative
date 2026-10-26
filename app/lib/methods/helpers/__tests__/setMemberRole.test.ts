import { setMemberRole } from '../setMemberRole';

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
