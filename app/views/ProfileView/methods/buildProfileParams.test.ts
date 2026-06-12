import { sha256 } from 'js-sha256';

import { type IUser } from '../../../definitions';
import buildProfileParams from './buildProfileParams';

const baseUser = {
	name: 'John Doe',
	username: 'john.doe',
	emails: [{ address: 'john@rocket.chat', verified: true }],
	bio: 'My bio',
	nickname: 'johnny'
} as unknown as IUser;

const baseForm = {
	name: 'John Doe',
	username: 'john.doe',
	email: 'john@rocket.chat',
	currentPassword: null,
	bio: 'My bio',
	nickname: 'johnny'
};

describe('buildProfileParams', () => {
	it('returns an empty object when nothing changed', () => {
		expect(buildProfileParams(baseForm, baseUser)).toEqual({});
	});

	it('includes name only when it changed', () => {
		expect(buildProfileParams({ ...baseForm, name: 'Jane Doe' }, baseUser)).toEqual({ name: 'Jane Doe' });
	});

	it('includes username only when it changed', () => {
		expect(buildProfileParams({ ...baseForm, username: 'jane.doe' }, baseUser)).toEqual({ username: 'jane.doe' });
	});

	it('includes email only when it changed', () => {
		expect(buildProfileParams({ ...baseForm, email: 'jane@rocket.chat' }, baseUser)).toEqual({ email: 'jane@rocket.chat' });
	});

	it('includes bio only when it changed', () => {
		expect(buildProfileParams({ ...baseForm, bio: 'New bio' }, baseUser)).toEqual({ bio: 'New bio' });
	});

	it('includes nickname only when it changed', () => {
		expect(buildProfileParams({ ...baseForm, nickname: 'jd' }, baseUser)).toEqual({ nickname: 'jd' });
	});

	it('hashes currentPassword with sha256 when provided', () => {
		const params = buildProfileParams({ ...baseForm, currentPassword: 'my-secret' }, baseUser);
		expect(params).toEqual({ currentPassword: sha256('my-secret') });
		expect(params.currentPassword).not.toBe('my-secret');
	});

	it('does not include currentPassword when it is null', () => {
		const params = buildProfileParams(baseForm, baseUser);
		expect(params).not.toHaveProperty('currentPassword');
	});

	it('aggregates every changed field at once', () => {
		const params = buildProfileParams(
			{
				name: 'Jane Doe',
				username: 'jane.doe',
				email: 'jane@rocket.chat',
				currentPassword: 'pass123',
				bio: 'New bio',
				nickname: 'jd'
			},
			baseUser
		);
		expect(params).toEqual({
			name: 'Jane Doe',
			username: 'jane.doe',
			email: 'jane@rocket.chat',
			bio: 'New bio',
			nickname: 'jd',
			currentPassword: sha256('pass123')
		});
	});
});
