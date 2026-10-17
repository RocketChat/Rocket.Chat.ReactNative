import { countMembersWhoCannotSeeChat } from '../countMembersWhoCannotSeeChat';

const users = [
	{ _id: 'me', joined: true },
	{ _id: 'ada', joined: true },
	{ _id: 'bob', joined: true },
	{ _id: 'cy', joined: false },
	{ _id: 'dee', joined: true, leftAt: '2026-10-15T08:00:00.000Z' }
];

const callWithout = (membersWithoutAccess: string[]) => ({ users, chatAccess: { membersWithoutAccess } });

describe('countMembersWhoCannotSeeChat', () => {
	it('counts the people in the call who cannot read the chat', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout(['ada', 'bob']), viewerId: 'me' })).toBe(2);
	});

	it('leaves out people who were invited but never joined', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout(['ada', 'cy']), viewerId: 'me' })).toBe(1);
	});

	it('leaves out people who have left the call', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout(['dee']), viewerId: 'me' })).toBe(0);
	});

	it('is zero for a viewer who cannot read the chat either, since they cannot share it', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout(['me', 'ada']), viewerId: 'me' })).toBe(0);
	});

	it('is zero when everyone can read the chat', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout([]), viewerId: 'me' })).toBe(0);
	});

	it('is zero before the call details have arrived', () => {
		expect(countMembersWhoCannotSeeChat({ info: undefined, viewerId: 'me' })).toBe(0);
	});

	it('still counts before we know who the viewer is', () => {
		expect(countMembersWhoCannotSeeChat({ info: callWithout(['ada']), viewerId: undefined })).toBe(1);
	});
});
