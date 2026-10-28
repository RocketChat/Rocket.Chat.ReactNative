jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn()
	}
}));

jest.mock('~/lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	UserCanceledError: class UserCanceledError extends Error {}
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		host: null
	}
}));

jest.mock('~/lib/methods/helpers/sslPinning', () => ({
	applyServerCertificate: jest.fn(() => Promise.resolve())
}));

jest.mock('~/lib/services/voip/resetVoipState', () => ({
	resetVoipState: jest.fn()
}));

jest.mock('~/lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	loginOAuthOrSso: jest.fn()
}));

import { all, fork } from 'redux-saga/effects';

import { deepLinkingOpen } from '~/actions/deepLinking';
import { selectServerRequest } from '~/actions/server';
import { APP } from '~/actions/actionsTypes';
import { RootEnum } from '~/definitions';
import deepLinkingRoot from '../deepLinking';
import selectServerRoot from '../selectServer';
import UserPreferences from '~/lib/methods/userPreferences';
import { getServerById } from '~/lib/database/services/Server';
import sdk from '~/lib/services/sdk';
import { localAuthenticate, UserCanceledError } from '~/lib/methods/helpers/localAuthentication';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { PreloadedState } from '~/lib/testUtils/sagaStore';

const HOST = 'https://open.rocket.chat';

const shareAndSelectServerRoot = function* shareAndSelectServerRoot() {
	yield all([fork(deepLinkingRoot), fork(selectServerRoot)]);
};

describe('share extension opened while connected to the same Workspace', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => (key === 'currentServer' ? HOST : 'user-1'));
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '7.0.0' } as any);
		(sdk as any).host = HOST;
	});

	afterEach(() => {
		cancelSagaTasks();
		(sdk as any).host = null;
	});

	it('lands on the share extension root, not the Inside Stack', async () => {
		const { store } = createRecordingStore(shareAndSelectServerRoot, { app: { root: RootEnum.ROOT_INSIDE } } as PreloadedState);

		store.dispatch(deepLinkingOpen({ type: 'shareextension', mediaUris: 'file:///photo.jpg' } as any));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_SHARE_EXTENSION);
		expect(store.getState().share.params).toMatchObject({ mediaUris: 'file:///photo.jpg' });
	});

	it('opens the Inside Stack after the share unlock is canceled and the app restarts', async () => {
		jest.mocked(localAuthenticate).mockRejectedValueOnce(new UserCanceledError());
		const { store, dispatchedActions } = createRecordingStore(shareAndSelectServerRoot, {
			app: { root: RootEnum.ROOT_INSIDE }
		} as PreloadedState);

		store.dispatch(deepLinkingOpen({ type: 'shareextension', mediaUris: 'file:///photo.jpg' } as any));
		await flushSagaMicrotasks();
		expect(dispatchedActions.some(action => action.type === APP.INIT)).toBe(true);

		store.dispatch(selectServerRequest(HOST, '7.0.0'));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_INSIDE);
	});
});
