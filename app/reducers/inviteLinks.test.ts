import {
	inviteLinksClear,
	inviteLinksFailure,
	inviteLinksRequest,
	inviteLinksSetInvite,
	inviteLinksSetParams,
	inviteLinksSetToken,
	inviteLinksSuccess
} from '../actions/inviteLinks';
import { initialState } from './inviteLinks';
import { mockedStore } from './mockedStore';

describe('test roles reducer', () => {
	const invite = {
		_id: 'nZestg',
		days: 1,
		maxUses: 0,
		createdAt: '2022-01-17T20:32:44.695Z',
		expires: '2022-01-18T20:32:44.695Z',
		uses: 0,
		_updatedAt: '2022-01-17T20:32:44.695Z',
		url: 'https://go.rocket.chat/invite?host=open.rocket.chat&path=invite%2FnZestg',
		success: true,
		token: ''
	};
	it('should return initial state', () => {
		const state = mockedStore.getState().inviteLinks;
		expect(state).toEqual(initialState);
	});

	it('should return initialState after call inviteLinksFailure', () => {
		mockedStore.dispatch(inviteLinksFailure());
		const state = mockedStore.getState().inviteLinks;
		expect(state).toEqual(initialState);
	});

	it('should return initialState after call inviteLinksSuccess', () => {
		mockedStore.dispatch(inviteLinksSuccess());
		const state = mockedStore.getState().inviteLinks;
		expect(state).toEqual(initialState);
	});

	it('should return correctly token after call inviteLinksSetToken', () => {
		mockedStore.dispatch(inviteLinksSetToken('xxx'));
		const { token } = mockedStore.getState().inviteLinks;
		expect(token).toEqual('xxx');
	});

	it('should return correctly invite value after call inviteLinksSetInvite', () => {
		mockedStore.dispatch(inviteLinksSetInvite(invite));
		const state = mockedStore.getState().inviteLinks;
		expect(state.invite).toEqual(invite);
	});

	it('should return modified store after call inviteLinksSetParams', () => {
		mockedStore.dispatch(inviteLinksSetParams({ token: 'nZestg' }));
		const { token } = mockedStore.getState().inviteLinks;
		expect(token).toEqual('nZestg');
	});

	it('should return initialState after call inviteLinksClear', () => {
		mockedStore.dispatch(inviteLinksClear());
		const state = mockedStore.getState().inviteLinks;
		expect(state).toEqual(initialState);
	});

	it('should return actual state after call inviteLinksRequest', () => {
		mockedStore.dispatch(inviteLinksRequest('xxx'));
		const state = mockedStore.getState().inviteLinks;
		expect(state).toEqual(initialState);
	});
});
