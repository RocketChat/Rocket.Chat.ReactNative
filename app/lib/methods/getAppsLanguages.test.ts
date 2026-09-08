import { store as reduxStore } from '../store/auxStore';
import { getAppsLanguages, normalizeAppsLanguages } from './getAppsLanguages';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(),
		dispatch: jest.fn()
	}
}));

jest.mock('./helpers/fetch', () => jest.fn());

const baseState = {
	server: { server: 'https://open.rocket.chat' },
	login: { user: { id: 'uid1', token: 'tok1' } }
};

describe('getAppsLanguages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(reduxStore.getState as jest.Mock).mockReturnValue(baseState);
	});

	it('fetches the apps-engine languages endpoint under the server root, not [object Object]', async () => {
		const fetch = require('./helpers/fetch');
		fetch.mockResolvedValue({ json: () => Promise.resolve({ success: true, apps: [] }) });

		await getAppsLanguages();

		expect(fetch).toHaveBeenCalledWith(
			'https://open.rocket.chat/api/apps/languages',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({ 'X-Auth-Token': 'tok1', 'X-User-Id': 'uid1' })
			})
		);
	});

	it('dispatches the normalized dictionary on success', async () => {
		const fetch = require('./helpers/fetch');
		fetch.mockResolvedValue({
			json: () => Promise.resolve({ success: true, apps: [{ id: 'app-1', languages: { en: { greeting: 'Hello' } } }] })
		});

		await getAppsLanguages();

		expect(reduxStore.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'SET_APPS_LANGUAGES', languages: { 'app-1': { en: { greeting: 'Hello' } } } })
		);
	});

	it('does not dispatch when the response is unsuccessful', async () => {
		const fetch = require('./helpers/fetch');
		fetch.mockResolvedValue({ json: () => Promise.resolve({ success: false }) });

		await getAppsLanguages();

		expect(reduxStore.dispatch).not.toHaveBeenCalled();
	});

	it('swallows a network failure without throwing', async () => {
		const fetch = require('./helpers/fetch');
		fetch.mockRejectedValue(new Error('network down'));

		await expect(getAppsLanguages()).resolves.toBeUndefined();
		expect(reduxStore.dispatch).not.toHaveBeenCalled();
	});
});

describe('normalizeAppsLanguages', () => {
	it('keys dictionaries by app id and lowercases language tags', () => {
		const result = normalizeAppsLanguages([
			{ id: 'app-1', languages: { en: { greeting: 'Hello' }, 'pt-BR': { greeting: 'Olá' } } }
		]);
		expect(result).toEqual({ 'app-1': { en: { greeting: 'Hello' }, 'pt-br': { greeting: 'Olá' } } });
	});

	it('normalizes underscore language tags', () => {
		const result = normalizeAppsLanguages([{ id: 'app-1', languages: { pt_BR: { greeting: 'Olá' } } }]);
		expect(result['app-1']['pt-br']).toEqual({ greeting: 'Olá' });
	});

	it('skips entries without an id', () => {
		const result = normalizeAppsLanguages([
			{ id: '', languages: { en: {} } },
			{ id: 'app-2', languages: { en: {} } }
		]);
		expect(Object.keys(result)).toEqual(['app-2']);
	});

	it('returns an empty object for an empty or missing list', () => {
		expect(normalizeAppsLanguages([])).toEqual({});
		expect(normalizeAppsLanguages(undefined)).toEqual({});
	});
});
