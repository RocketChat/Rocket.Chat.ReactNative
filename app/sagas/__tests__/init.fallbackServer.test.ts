const FALLBACK_SERVER = 'https://fallback.rocket.chat';
const FALLBACK_VERSION = '7.0.0';
const LOGGED_OUT_SERVER = 'https://loggedout.rocket.chat';

jest.mock('../../lib/database/services/Server', () => ({
	getServerById: jest.fn(),
	getAllServers: jest.fn(() => Promise.resolve([{ id: FALLBACK_SERVER, version: FALLBACK_VERSION }]))
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

import { appInit } from '../../actions/app';
import { SERVER } from '../../actions/actionsTypes';
import { CURRENT_SERVER, TOKEN_KEY } from '../../lib/constants/keys';
import UserPreferences from '../../lib/methods/userPreferences';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import initRoot from '../init';

describe('init saga — fallback workspace', () => {
	beforeEach(() => {
		jest.mocked(localAuthenticate).mockClear();
		UserPreferences.setString(CURRENT_SERVER, LOGGED_OUT_SERVER);
		UserPreferences.removeItem(`${TOKEN_KEY}-${LOGGED_OUT_SERVER}`);
		UserPreferences.setString(`${TOKEN_KEY}-${FALLBACK_SERVER}`, 'userId');
	});

	afterEach(() => {
		cancelSagaTasks();
		UserPreferences.removeItem(CURRENT_SERVER);
		UserPreferences.removeItem(`${TOKEN_KEY}-${FALLBACK_SERVER}`);
	});

	it('requests the fallback workspace with the version from its own record', async () => {
		const { store, dispatchedActions } = createRecordingStore(initRoot);

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(dispatchedActions.find(action => action.type === SERVER.SELECT_REQUEST)).toEqual(
			expect.objectContaining({ server: FALLBACK_SERVER, version: FALLBACK_VERSION })
		);
		expect(jest.mocked(localAuthenticate)).toHaveBeenCalledWith(FALLBACK_SERVER);
	});

	it('requests the fallback workspace when the current server was cleared by a logout', async () => {
		UserPreferences.removeItem(CURRENT_SERVER);
		const { store, dispatchedActions } = createRecordingStore(initRoot);

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(dispatchedActions.find(action => action.type === SERVER.SELECT_REQUEST)).toEqual(
			expect.objectContaining({ server: FALLBACK_SERVER, version: FALLBACK_VERSION })
		);
	});
});
