import { getChatAccessActions } from '../getChatAccessActions';

describe('getChatAccessActions', () => {
	it('leads with adding them to the room in a public channel they can be invited to', () => {
		expect(getChatAccessActions({ canInvite: true, type: 'c' })).toEqual(['invite', 'discussion']);
	});

	it.each(['p', 'd'])('leads with a discussion in a room of type %s, so its history is not given away', type => {
		expect(getChatAccessActions({ canInvite: true, type })).toEqual(['discussion', 'invite']);
	});

	it.each(['c', 'p', 'd'])('offers only a discussion where a room of type %s cannot take new members', type => {
		expect(getChatAccessActions({ canInvite: false, type })).toEqual(['discussion']);
	});
});
