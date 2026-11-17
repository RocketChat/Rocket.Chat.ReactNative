import { isReadOnlySync } from '../isReadOnly';

const username = 'alice';

describe('isReadOnlySync', () => {
	it('is writable in a regular room', () => {
		expect(isReadOnlySync({ ro: false }, username, [], [])).toBe(false);
	});

	it('is read-only in an archived room', () => {
		expect(isReadOnlySync({ archived: true }, username, [], ['admin'])).toBe(true);
	});

	it('is read-only when the user is muted', () => {
		expect(isReadOnlySync({ muted: [username] }, username, [], [])).toBe(true);
	});

	it('is read-only in a read-only room without the post permission', () => {
		expect(isReadOnlySync({ ro: true }, username, ['admin'], ['user'])).toBe(true);
	});

	it('is writable in a read-only room when a user role has the post permission', () => {
		expect(isReadOnlySync({ ro: true }, username, ['admin'], ['user', 'admin'])).toBe(false);
	});

	it('is writable in a read-only room when a room role has the post permission', () => {
		expect(isReadOnlySync({ ro: true, roles: ['owner'] }, username, ['owner'], ['user'])).toBe(false);
	});

	it('is writable in a read-only room when the user is unmuted', () => {
		expect(isReadOnlySync({ ro: true, unmuted: [username] }, username, undefined, [])).toBe(false);
	});
});
