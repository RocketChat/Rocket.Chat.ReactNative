import { TUserStatus } from '../definitions';
import {
	clearUser,
	loginFailure,
	loginRequest,
	loginSuccess,
	logout,
	setLocalAuthenticated,
	setLoginServices,
	setUser
} from '../actions/login';
import { initialState } from './login';
import { mockedStore } from './mockedStore';

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
			isFromWebView: false,
			showMessageInMainThread: false,
			enableMessageParserEarlyAdoption: false,
			status: 'online' as TUserStatus,
			statusText: 'online'
		};
		mockedStore.dispatch(loginSuccess(user));
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
			isFromWebView: false,
			showMessageInMainThread: false,
			enableMessageParserEarlyAdoption: false
		};
		mockedStore.dispatch(setUser(user));
		const state = mockedStore.getState().login.user.username;
		expect(state).toEqual(user.username);
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
