import { onAppsStreamData, useAppsStore } from '../appsStore';
import { UIActionButtonContext } from '../definitions';

const mockGetAppActionButtons = jest.fn(() =>
	Promise.resolve([
		{ appId: 'app-id', actionId: 'summarize', context: UIActionButtonContext.MESSAGE_BOX_ACTION, labelI18n: 'summarize' }
	])
);
const mockGetAppsLanguages = jest.fn(() =>
	Promise.resolve({ apps: [{ id: 'app-id', languages: { en: { summarize: 'Summarize' } } }] })
);
jest.mock('~/lib/services/restApi', () => ({
	getAppActionButtons: () => mockGetAppActionButtons(),
	getAppsLanguages: () => mockGetAppsLanguages()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('appsStore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useAppsStore.getState().reset();
	});

	it('stores the fetched action buttons and translations', async () => {
		await useAppsStore.getState().fetchActionButtons();
		await useAppsStore.getState().fetchTranslations();

		expect(useAppsStore.getState().actionButtons).toHaveLength(1);
		expect(useAppsStore.getState().translations).toEqual({ 'app-id': { en: { summarize: 'Summarize' } } });
	});

	it('drops responses that resolve after reset', async () => {
		const pendingButtons = useAppsStore.getState().fetchActionButtons();
		const pendingTranslations = useAppsStore.getState().fetchTranslations();
		useAppsStore.getState().reset();
		await Promise.all([pendingButtons, pendingTranslations]);

		expect(useAppsStore.getState().actionButtons).toEqual([]);
		expect(useAppsStore.getState().translations).toEqual({});
	});

	it('refetches only the action buttons on actions/changed', async () => {
		onAppsStreamData({ fields: { args: [['actions/changed', []]] } });
		await flush();

		expect(mockGetAppActionButtons).toHaveBeenCalledTimes(1);
		expect(mockGetAppsLanguages).not.toHaveBeenCalled();
	});

	it('refetches only the translations on app/added', async () => {
		onAppsStreamData({ fields: { args: [['app/added', ['app-id']]] } });
		await flush();

		expect(mockGetAppsLanguages).toHaveBeenCalledTimes(1);
		expect(mockGetAppActionButtons).not.toHaveBeenCalled();
	});
});
