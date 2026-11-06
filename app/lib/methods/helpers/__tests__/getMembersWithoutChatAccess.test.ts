import { getMembersWithoutChatAccess } from '../getMembersWithoutChatAccess';

describe('getMembersWithoutChatAccess', () => {
	const users = [{ _id: 'ada' }, { _id: 'bob' }, { _id: 'cy' }];

	it('keeps the members the server listed, in the order of the call', () => {
		expect(getMembersWithoutChatAccess(users, ['cy', 'ada'])).toEqual([{ _id: 'ada' }, { _id: 'cy' }]);
	});

	it('ignores ids that are not members of the call', () => {
		expect(getMembersWithoutChatAccess(users, ['zed'])).toEqual([]);
	});

	it('is empty when everyone can read the chat', () => {
		expect(getMembersWithoutChatAccess(users, [])).toEqual([]);
	});
});
