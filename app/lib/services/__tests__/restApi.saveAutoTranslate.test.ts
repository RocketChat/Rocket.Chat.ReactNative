import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { getSupportedLanguagesAutoTranslate, saveAutoTranslate } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(true),
		get: jest.fn(),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('saveAutoTranslate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.6.0');
	});

	it('sends 1 over DDP below 8.6.0 when enabling auto translate', async () => {
		setServerVersion('8.5.9');
		await saveAutoTranslate({ rid: 'rid1', field: 'autoTranslate', value: true, options: { defaultLanguage: 'en' } });
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('autoTranslate.saveSettings', 'rid1', 'autoTranslate', '1', {
			defaultLanguage: 'en'
		});
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('sends 0 over DDP below 8.6.0 when disabling auto translate', async () => {
		setServerVersion('8.5.9');
		await saveAutoTranslate({ rid: 'rid1', field: 'autoTranslate', value: false, options: { defaultLanguage: 'en' } });
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('autoTranslate.saveSettings', 'rid1', 'autoTranslate', '0', {
			defaultLanguage: 'en'
		});
	});

	it('sends the language and null options over DDP below 8.6.0', async () => {
		setServerVersion('8.5.9');
		await saveAutoTranslate({ rid: 'rid1', field: 'autoTranslateLanguage', value: 'pt-BR' });
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith(
			'autoTranslate.saveSettings',
			'rid1',
			'autoTranslateLanguage',
			'pt-BR',
			null
		);
	});

	it('posts a boolean value and the default language to autotranslate.saveSettings on 8.6.0+', async () => {
		await saveAutoTranslate({ rid: 'rid1', field: 'autoTranslate', value: true, options: { defaultLanguage: 'en' } });
		expect(sdk.post).toHaveBeenCalledWith('autotranslate.saveSettings', {
			roomId: 'rid1',
			field: 'autoTranslate',
			value: true,
			defaultLanguage: 'en'
		});
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('posts the language without a defaultLanguage key on 8.6.0+', async () => {
		await saveAutoTranslate({ rid: 'rid1', field: 'autoTranslateLanguage', value: 'pt-BR' });
		expect((sdk.post as jest.Mock).mock.calls[0]).toStrictEqual([
			'autotranslate.saveSettings',
			{ roomId: 'rid1', field: 'autoTranslateLanguage', value: 'pt-BR' }
		]);
	});
});

describe('getSupportedLanguagesAutoTranslate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('9.0.0');
	});

	it('calls the autoTranslate.getSupportedLanguages DDP method below 9.0.0', async () => {
		setServerVersion('8.9.0');
		await getSupportedLanguagesAutoTranslate();
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('autoTranslate.getSupportedLanguages', 'en');
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('gets autotranslate.getSupportedLanguages and returns its languages on 9.0.0+', async () => {
		const languages = [{ language: 'en', name: 'English' }];
		(sdk.get as jest.Mock).mockResolvedValueOnce({ success: true, languages });
		await expect(getSupportedLanguagesAutoTranslate()).resolves.toEqual(languages);
		expect(sdk.get).toHaveBeenCalledWith('autotranslate.getSupportedLanguages', { targetLanguage: 'en' });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('rejects on 9.0.0+ when the server reports a failure', async () => {
		(sdk.get as jest.Mock).mockResolvedValueOnce({ success: false });
		await expect(getSupportedLanguagesAutoTranslate()).rejects.toThrow();
	});
});
