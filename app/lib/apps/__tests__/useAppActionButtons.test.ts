import { act, renderHook, waitFor } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import { type IAppActionButton, UIActionButtonContext } from '../definitions';
import { selectAppActionButtons, useAppActionButtons } from '../useAppActionButtons';

let mockActionButtons: IAppActionButton[] = [];
const mockTranslations = { 'app-id': { en: { summarize: 'Summarize thread' } } };
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
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: () => mockUserRoles
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
	});

	it('returns nothing until the room is resolved', () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		expect(result.current).toEqual([]);
	});

	it('labels a button with the app translation for the active locale', async () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0]).toMatchObject({ id: 'app-id/summarize', label: 'Summarize thread' });
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

	it('selects by context and category', async () => {
		mockActionButtons = [
			button(),
			button({ actionId: 'ai-one', category: 'ai' }),
			button({ actionId: 'other', context: UIActionButtonContext.ROOM_ACTION })
		];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(3));
		const pick = (category?: 'ai') =>
			selectAppActionButtons(result.current, UIActionButtonContext.MESSAGE_BOX_ACTION, category).map(i => i.button.actionId);
		expect(pick()).toEqual(['summarize']);
		expect(pick('ai')).toEqual(['ai-one']);
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

	it('resolves a permission against the roles the subscription and the user hold', async () => {
		mockActionButtons = [button({ when: { hasOnePermission: ['pin-message'] } })];
		mockPermissionRecords = [{ id: 'pin-message', roles: ['owner'] }];

		const { result } = renderHook(() => useAppActionButtons('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));

		mockPermissionRecords = [{ id: 'pin-message', roles: ['admin'] }];
		const second = renderHook(() => useAppActionButtons('rid-2'));

		await waitFor(() => expect(second.result.current).toEqual([]));
	});
});
