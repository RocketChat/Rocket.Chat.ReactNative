import { isRead } from '../helpers';

const openRoom = { open: true, archived: false, unread: 0, alert: false, tunread: [] as string[] };

describe('isRead', () => {
	it('is read when there are no unreads', () => {
		expect(isRead(openRoom)).toBe(true);
	});

	it('is unread when there are unread messages', () => {
		expect(isRead({ ...openRoom, unread: 2 })).toBe(false);
	});

	it('is unread when only threads have unread messages', () => {
		expect(isRead({ ...openRoom, tunread: ['tmid'] })).toBe(false);
	});

	it('is read when the room is archived even with thread unreads', () => {
		expect(isRead({ ...openRoom, archived: true, tunread: ['tmid'] })).toBe(true);
	});
});
