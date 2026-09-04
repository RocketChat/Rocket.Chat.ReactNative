import { renderHook, waitFor } from '@testing-library/react-native';

import { useAutocomplete } from './useAutocomplete';
import { type IAutocompleteEmoji } from '../interfaces';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(() => ({ query: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue([]) })) })) } }
}));
jest.mock('../../../lib/methods/search', () => ({ searchLocal: jest.fn(), searchRemote: jest.fn() }));
jest.mock('../../../lib/services/restApi', () => ({ getCommandPreview: jest.fn(), getListCannedResponse: jest.fn() }));
jest.mock('../../../lib/hooks/usePermissions', () => ({ usePermissions: () => [false, false] }));
jest.mock('../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const names = async (text: string) => {
	const { result } = renderHook(() => useAutocomplete({ text, type: ':', rid: 'rid', accessibilityFocusOnInput: () => null }));
	await waitFor(() => expect(result.current.some(item => item.type === ':')).toBe(true));
	return (result.current as IAutocompleteEmoji[]).map(item => item.emoji);
};

describe('useAutocomplete emoji suggestions', () => {
	it('suggests an emoji by its listed shortname', async () => {
		expect(await names('ocean')).toContain('ocean');
	});

	it('suggests an emoji typed by an alias, returning the listed shortname', async () => {
		expect(await names('water_wave')).toContain('ocean');
	});

	it('matches case insensitively, like the emoji picker search', async () => {
		expect(await names('Ocean')).toContain('ocean');
	});
});
