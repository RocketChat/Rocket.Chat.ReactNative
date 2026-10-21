import { act, renderHook, waitFor } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import { type IAppActionButton, UIActionButtonContext } from '../definitions';
import { useAppActionButtons } from '../useAppActionButtons';

let mockActionButtons: IAppActionButton[] = [];
const mockTranslations = { 'app-id': { en: { summarize: 'Summarize thread' }, pt: { summarize: 'Resumir thread' } } };
jest.mock('../appsStore', () => ({
	useAppsStore: (selector: (state: unknown) => unknown) =>
		selector({ actionButtons: mockActionButtons, translations: mockTranslations })
}));

let mockSubscriptions: BehaviorSubject<Record<string, unknown>[]>;
let mockPermissionRecords: { id: string; roles: string[] }[] = [];
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return {
				get: (table: string) => ({
					query: () => ({
						observeWithColumns: () => {
							const { BehaviorSubject: Subject, asapScheduler, observeOn } = jest.requireActual('rxjs');
							const source = table === 'subscriptions' ? mockSubscriptions : new Subject(mockPermissionRecords);
							return source.pipe(observeOn(asapScheduler));
						}
					})
				})
			};
		}
	}
}));

let mockUserRoles: string[] = ['user'];
let mockLanguage = 'en';
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: unknown) => unknown) =>
		selector({ login: { user: { roles: mockUserRoles, language: mockLanguage } } })
}));

const button = (overrides: Partial<IAppActionButton> = {}): IAppActionButton => ({
	appId: 'app-id',
	actionId: 'summarize',
	context: UIActionButtonContext.MESSAGE_BOX_ACTION,
	labelI18n: 'summarize',
	...overrides
});

describe('useAppActionButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockActionButtons = [];
		mockSubscriptions = new BehaviorSubject<Record<string, unknown>[]>([{ t: 'c', roles: ['owner'] }]);
		mockPermissionRecords = [];
		mockUserRoles = ['user'];
		mockLanguage = 'en';
	});

	it('returns nothing until the room is resolved', async () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		expect(result.current).toEqual([]);
		await waitFor(() => expect(result.current).toHaveLength(1));
	});

	it('labels a button with the app translation for the active locale', async () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0]).toMatchObject({ id: 'app-id/summarize', label: 'Summarize thread' });
	});

	it('relabels buttons when the user language changes', async () => {
		mockActionButtons = [button()];
		const { result, rerender } = renderHook(() => useAppActionButtons('rid'));
		await waitFor(() => expect(result.current).toHaveLength(1));

		mockLanguage = 'pt-BR';
		rerender({});

		expect(result.current[0].label).toBe('Resumir thread');
	});

	it('drops the previous room buttons until the new room resolves', async () => {
		mockActionButtons = [button()];

		const { result, rerender } = renderHook(({ rid }: { rid: string }) => useAppActionButtons(rid), {
			initialProps: { rid: 'rid' }
		});

		await waitFor(() => expect(result.current).toHaveLength(1));

		rerender({ rid: 'other-rid' });

		expect(result.current).toEqual([]);
		await waitFor(() => expect(result.current).toHaveLength(1));
	});

	it('follows subscription changes while mounted', async () => {
		mockActionButtons = [button({ when: { roomTypes: ['public_channel'] } })];
		mockSubscriptions = new BehaviorSubject<Record<string, unknown>[]>([]);

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toEqual([]));
		act(() => mockSubscriptions.next([{ t: 'c', roles: [] }]));
		await waitFor(() => expect(result.current).toHaveLength(1));
	});

	it('drops a button whose room type does not match', async () => {
		mockActionButtons = [
			button({ when: { roomTypes: ['direct'] } }),
			button({ actionId: 'channel-only', when: { roomTypes: ['public_channel'] } })
		];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('channel-only');
	});

	it('grants a permission through the workspace roles only, as on web', async () => {
		mockActionButtons = [button({ when: { hasOnePermission: ['pin-message'] } })];
		mockPermissionRecords = [{ id: 'pin-message', roles: ['user'] }];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));

		mockActionButtons = [button({ actionId: 'unconditional' }), button({ when: { hasOnePermission: ['pin-message'] } })];
		mockPermissionRecords = [{ id: 'pin-message', roles: ['owner'] }];
		const second = renderHook(() => useAppActionButtons('rid-2'));

		await waitFor(() => expect(second.result.current).toHaveLength(1));
		expect(second.result.current[0].button.actionId).toBe('unconditional');
	});

	it('matches a role the user holds in the room', async () => {
		mockActionButtons = [button({ when: { hasOneRole: ['owner'] } })];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
	});
});
