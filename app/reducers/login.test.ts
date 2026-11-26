import { type TUserStatus } from '../definitions/TUserStatus';
import {
	clearUser,
	loginCancel,
	loginFailure,
	loginRequest,
	loginSuccess,
	logout,
	setLocalAuthenticated,
	setLoginServices,
	setUser
} from '../actions/login';
import { initialState } from './login';
import { createMockedStore, mockedStore } from './mockedStore';

const SERVER = 'https://open.rocket.chat';
const OTHER_SERVER = 'https://other.rocket.chat';

describe('test selectedUsers reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().login;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after loginRequest', () => {
		mockedStore.dispatch(loginRequest({ user: 'carlitos@email.com', password: '123456' }));
		const state = mockedStore.getState().login;
		expect(state).toEqual({ ...initialState, isFetching: true, isAuthenticated: false, failure: false, error: {} });
	});

	it('should return modified store after loginFailure', () => {
		mockedStore.dispatch(loginFailure({ error: 'error' }));
		const state = mockedStore.getState().login.error.error;
		expect(state).toEqual('error');
	});

	it('should return modified store after loginSuccess', () => {
		const user = {
			id: 'ajhsiahsa',
			token: 'asdasdasdas',
			username: 'carlitos',
			name: 'Carlitos',
			customFields: {
				phonenumber: ''
			},
			emails: [
				{
					address: 'carlitos@email.com',
					verified: true
				}
			],
			roles: ['user'],
			showMessageInMainThread: false,
			enableMessageParserEarlyAdoption: false,
			status: 'online' as TUserStatus,
			statusText: 'online'
		};
		mockedStore.dispatch(loginSuccess(user, SERVER));
		const state = mockedStore.getState().login.user;
		expect(state).toEqual(user);
	});

	it('should return modified store after setUser', () => {
		const user = {
			id: 'ajhsiahsa',
			token: 'asdasdasdas',
			username: 'carlito',
			name: 'Carlitos',
			customFields: {
				phonenumber: ''
			},
			emails: [
				{
					address: 'carlitos@email.com',
					verified: true
				}
			],
			roles: ['user'],
			showMessageInMainThread: false,
			enableMessageParserEarlyAdoption: false
		};
		mockedStore.dispatch(setUser(user));
		const state = mockedStore.getState().login.user.username;
		expect(state).toEqual(user.username);
	});

	it('should keep the same user object when setUser changes nothing', () => {
		const before = mockedStore.getState().login.user;
		mockedStore.dispatch(setUser({ username: before.username, status: before.status }));
		expect(mockedStore.getState().login.user).toBe(before);
	});

	it('should replace the user object when setUser changes a field', () => {
		const before = mockedStore.getState().login.user;
		mockedStore.dispatch(setUser({ statusText: 'Lunch' }));
		const after = mockedStore.getState().login.user;
		expect(after).not.toBe(before);
		expect(after.statusText).toEqual('Lunch');
		expect(after.username).toEqual(before.username);
	});

	it('should take the server settings when the same user logs in again', () => {
		const store = createMockedStore();
		store.dispatch(
			loginSuccess({ id: 'user-id', username: 'carlito', settings: { preferences: { convertAsciiEmoji: true } } }, SERVER)
		);
		store.dispatch(
			loginSuccess({ id: 'user-id', username: 'carlito', settings: { preferences: { convertAsciiEmoji: false } } }, SERVER)
		);
		expect(store.getState().login.user.settings).toEqual({ preferences: { convertAsciiEmoji: false } });
	});

	it('should keep the same user object when the same user logs in with unchanged fields', () => {
		const store = createMockedStore();
		const settings = { preferences: { convertAsciiEmoji: true } };
		store.dispatch(loginSuccess({ id: 'user-id', username: 'carlito', roles: ['user'], settings }, SERVER));
		const before = store.getState().login.user;
		store.dispatch(loginSuccess({ id: 'user-id', username: 'carlito', roles: ['user'], settings: { ...settings } }, SERVER));
		expect(store.getState().login.user).toBe(before);
	});

	it('should drop the user settings when a different user logs in', () => {
		const store = createMockedStore();
		store.dispatch(
			loginSuccess({ id: 'user-id', username: 'carlito', settings: { preferences: { convertAsciiEmoji: true } } }, SERVER)
		);
		store.dispatch(loginSuccess({ id: 'other-id', username: 'other' }, SERVER));
		expect(store.getState().login.user.settings).toBeUndefined();
	});

	it('should not carry the previous server settings when switching to another server', () => {
		const store = createMockedStore();
		store.dispatch(
			loginSuccess(
				{
					id: 'user-id',
					username: 'carlito',
					settings: { preferences: { convertAsciiEmoji: true, enableMobileRinging: true } }
				},
				SERVER
			)
		);
		store.dispatch(setUser({ id: 'other-server-user-id', username: 'carlito' }));
		store.dispatch(loginSuccess({ id: 'other-server-user-id', username: 'carlito' }, OTHER_SERVER));
		expect(store.getState().login.user.settings).toBeUndefined();
	});

	it('should record which workspace the login succeeded on', () => {
		const store = createMockedStore();
		store.dispatch(loginSuccess({ id: 'user-id', username: 'carlito' }, SERVER));
		expect(store.getState().login.signedInServer).toBe(SERVER);
		store.dispatch(loginSuccess({ id: 'user-id', username: 'carlito' }, OTHER_SERVER));
		expect(store.getState().login.signedInServer).toBe(OTHER_SERVER);
	});

	it('should stop fetching without signing in or failing when a login is cancelled', () => {
		const store = createMockedStore();
		store.dispatch(loginRequest({ resume: 'token' }));
		store.dispatch(loginCancel());
		const { isFetching, isAuthenticated, failure } = store.getState().login;
		expect({ isFetching, isAuthenticated, failure }).toEqual({ isFetching: false, isAuthenticated: false, failure: false });
	});

	it('should clear user after clearUser', () => {
		mockedStore.dispatch(clearUser());
		const state = mockedStore.getState().login.user;
		expect(state).toEqual({});
	});

	// TODO PREFERENCE REDUCER WITH EMPTY PREFERENCE - NON USED?
	// it('should return modified store after setPreference', () => {
	// 	mockedStore.dispatch(setPreference({ showAvatar: true }));
	// 	const state = mockedStore.getState().login;
	// 	console.log(state);
	// 	expect(state).toEqual('error');
	// });

	it('should return modified store after setLocalAuthenticated', () => {
		mockedStore.dispatch(setLocalAuthenticated(true));
		const state = mockedStore.getState().login.isLocalAuthenticated;
		expect(state).toEqual(true);
	});

	it('should return modified store after setLoginServices', () => {
		mockedStore.dispatch(setLoginServices({ facebook: { clientId: 'xxx' } }));
		const state = mockedStore.getState().login.services.facebook.clientId;
		expect(state).toEqual('xxx');
	});

	it('should return modified store after logout', () => {
		mockedStore.dispatch(logout());
		const state = mockedStore.getState().login;
		expect(state).toEqual(initialState);
	});
});
