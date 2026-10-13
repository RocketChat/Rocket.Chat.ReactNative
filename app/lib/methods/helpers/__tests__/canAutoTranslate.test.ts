import { store } from '~/lib/store/auxStore';
import { canAutoTranslate } from '../helpers';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

const mockGetState = store.getState as jest.Mock;

const givenState = ({
	enabled = true,
	permissionRoles,
	userRoles
}: {
	enabled?: boolean;
	permissionRoles?: string[];
	userRoles?: string[];
}) =>
	mockGetState.mockReturnValue({
		settings: { AutoTranslate_Enabled: enabled },
		permissions: { 'auto-translate': permissionRoles },
		login: { user: { roles: userRoles } }
	});

describe('canAutoTranslate', () => {
	it('allows a user holding one of the permitted roles', () => {
		givenState({ permissionRoles: ['admin', 'user'], userRoles: ['user'] });
		expect(canAutoTranslate()).toBe(true);
	});

	it('denies a user without any permitted role', () => {
		givenState({ permissionRoles: ['admin'], userRoles: ['user', 'e2e_admin'] });
		expect(canAutoTranslate()).toBe(false);
	});

	it('denies a user without roles', () => {
		givenState({ permissionRoles: ['user'], userRoles: undefined });
		expect(canAutoTranslate()).toBe(false);
	});

	it('denies when the permission is not loaded', () => {
		givenState({ permissionRoles: undefined, userRoles: ['user'] });
		expect(canAutoTranslate()).toBe(false);
	});

	it('denies when auto-translate is disabled on the server', () => {
		givenState({ enabled: false, permissionRoles: ['user'], userRoles: ['user'] });
		expect(canAutoTranslate()).toBe(false);
	});
});
