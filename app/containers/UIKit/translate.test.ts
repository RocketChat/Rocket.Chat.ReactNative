import { store as reduxStore } from '../../lib/store/auxStore';
import { translateKey, translateText } from './translate';

jest.mock('../../lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

const getState = reduxStore.getState as jest.Mock;

const mockState = (language?: string) =>
	getState.mockReturnValue({
		apps: {
			languages: {
				'app-1': {
					en: { 'giphy.add': 'Add a GIPHY', 'giphy.hello': 'Hello, {{name}}!' },
					'pt-br': { 'giphy.add': 'Adicionar um GIPHY' }
				}
			}
		},
		login: { user: { language } }
	});

describe('translateKey', () => {
	it('resolves a key from the app dictionary in the user language', () => {
		mockState('pt-BR');
		expect(translateKey('giphy.add', 'app-1')).toBe('Adicionar um GIPHY');
	});

	it('interpolates args', () => {
		mockState('en');
		expect(translateKey('giphy.hello', 'app-1', { name: 'Bob' })).toBe('Hello, Bob!');
	});

	it('returns undefined without an appId', () => {
		mockState('en');
		expect(translateKey('giphy.add')).toBeUndefined();
	});

	it('returns undefined for an unknown app', () => {
		mockState('en');
		expect(translateKey('giphy.add', 'app-unknown')).toBeUndefined();
	});
});

describe('translateText', () => {
	beforeEach(() => mockState('en'));

	it('prefers the app dictionary', () => {
		expect(translateText({ type: 'mrkdwn', text: 'fallback', i18n: { key: 'giphy.add' } }, 'app-1')).toBe('Add a GIPHY');
	});

	it('falls back to the RN dictionary for core keys the app dictionary does not have', () => {
		// Call_ended_bold ships in app/i18n/locales/en.json and is sent by videoconf-core.
		expect(translateText({ type: 'mrkdwn', text: 'Call ended', i18n: { key: 'Call_ended_bold' } }, 'videoconf-core')).toBe(
			'*Voice call ended*'
		);
	});

	it('falls back to the literal text when the key is in neither dictionary', () => {
		expect(translateText({ type: 'plain_text', text: 'Literal', i18n: { key: 'nope.nope' } }, 'app-1')).toBe('Literal');
	});

	it('returns the literal text when there is no i18n descriptor', () => {
		expect(translateText({ type: 'plain_text', text: 'Literal' }, 'app-1')).toBe('Literal');
	});

	it('returns an empty string for undefined text', () => {
		expect(translateText(undefined, 'app-1')).toBe('');
	});

	it('does not throw when the store has no apps slice yet', () => {
		getState.mockReturnValue({ login: { user: {} } });
		expect(translateText({ type: 'plain_text', text: 'Literal', i18n: { key: 'giphy.add' } }, 'app-1')).toBe('Literal');
	});
});

describe('translateKey against a real apps/languages + commands.list payload shape', () => {
	// Confirmed live: commands.list sends description
	// "app-c33fa1a6-68a7-491e-bf49-9d7b99671c48.cmd_description" for appId
	// 'c33fa1a6-68a7-491e-bf49-9d7b99671c48', while apps/languages stores the bare key
	// languages.en.cmd_description under that same app id.
	const pollAppId = 'c33fa1a6-68a7-491e-bf49-9d7b99671c48';

	beforeEach(() => {
		getState.mockReturnValue({
			apps: { languages: { [pollAppId]: { en: { cmd_description: 'Create a simple poll' } } } },
			login: { user: { language: 'en' } }
		});
	});

	it('resolves a slash command description sent with the app-key placeholder prefix', () => {
		expect(translateKey(`app-${pollAppId}.cmd_description`, pollAppId)).toBe('Create a simple poll');
	});
});
