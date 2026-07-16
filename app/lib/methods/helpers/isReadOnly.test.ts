import { isReadOnly, isReadOnlySync } from './isReadOnly';
import { hasPermission } from './helpers';
import { store as reduxStore } from '../../store/auxStore';

jest.mock('./helpers', () => ({
	hasPermission: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

const mockedHasPermission = hasPermission as jest.Mock;
const mockedGetState = (reduxStore as unknown as { getState: jest.Mock }).getState;

const username = 'user1';
const postReadOnlyPermission = ['admin'];

beforeEach(() => {
	jest.clearAllMocks();
	mockedGetState.mockReturnValue({ permissions: { 'post-readonly': postReadOnlyPermission } });
	mockedHasPermission.mockResolvedValue([false]);
});

describe('isReadOnly (async)', () => {
	test('archived room is read only', async () => {
		expect(await isReadOnly({ archived: true }, username)).toBe(true);
		expect(mockedHasPermission).not.toHaveBeenCalled();
	});

	test('muted user is read only', async () => {
		expect(await isReadOnly({ muted: [username] }, username)).toBe(true);
		expect(mockedHasPermission).not.toHaveBeenCalled();
	});

	test('non-ro room is not read only', async () => {
		expect(await isReadOnly({}, username)).toBe(false);
		expect(mockedHasPermission).not.toHaveBeenCalled();
	});

	test('ro + archived returns true without fetching permission', async () => {
		expect(await isReadOnly({ ro: true, rid: 'rid1', archived: true }, username)).toBe(true);
		expect(mockedHasPermission).not.toHaveBeenCalled();
	});

	test('ro + muted returns true without fetching permission', async () => {
		expect(await isReadOnly({ ro: true, rid: 'rid1', muted: [username] }, username)).toBe(true);
		expect(mockedHasPermission).not.toHaveBeenCalled();
	});

	test('ro room without post permission is read only', async () => {
		mockedHasPermission.mockResolvedValue([false]);
		expect(await isReadOnly({ ro: true, rid: 'rid1' }, username)).toBe(true);
	});

	test('ro room with post permission is not read only', async () => {
		mockedHasPermission.mockResolvedValue([true]);
		expect(await isReadOnly({ ro: true, rid: 'rid1' }, username)).toBe(false);
	});

	test('ro room with unmuted user is not read only', async () => {
		mockedHasPermission.mockResolvedValue([false]);
		expect(await isReadOnly({ ro: true, rid: 'rid1', unmuted: [username] }, username)).toBe(false);
	});
});

describe('isReadOnlySync', () => {
	test('archived room is read only', () => {
		expect(isReadOnlySync({ archived: true }, username, postReadOnlyPermission, [])).toBe(true);
	});

	test('muted user is read only', () => {
		expect(isReadOnlySync({ muted: [username] }, username, postReadOnlyPermission, [])).toBe(true);
	});

	test('non-ro room is not read only', () => {
		expect(isReadOnlySync({}, username, postReadOnlyPermission, [])).toBe(false);
	});

	test('ro room without matching role is read only', () => {
		expect(isReadOnlySync({ ro: true, roles: ['user'] }, username, postReadOnlyPermission, ['user'])).toBe(true);
	});

	test('ro room with matching room role is not read only', () => {
		expect(isReadOnlySync({ ro: true, roles: ['admin'] }, username, postReadOnlyPermission, [])).toBe(false);
	});

	test('ro room with matching user role is not read only', () => {
		expect(isReadOnlySync({ ro: true, roles: [] }, username, postReadOnlyPermission, ['admin'])).toBe(false);
	});

	test('ro room with unmuted user is not read only', () => {
		expect(isReadOnlySync({ ro: true, roles: ['user'], unmuted: [username] }, username, postReadOnlyPermission, ['user'])).toBe(
			false
		);
	});
});
