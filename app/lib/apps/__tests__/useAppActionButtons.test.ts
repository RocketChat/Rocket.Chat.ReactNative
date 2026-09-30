import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type IAppActionButton, UIActionButtonContext } from '../definitions';
import { useAppActionButtons } from '../useAppActionButtons';

let mockActionButtons: IAppActionButton[] = [];
const mockTranslations = { 'app-id': { en: { summarize: 'Summarize thread' } } };
const mockSubscribeToApps = jest.fn(() => jest.fn());
jest.mock('../appsStore', () => ({
	subscribeToApps: () => mockSubscribeToApps(),
	useAppsStore: (selector: (state: unknown) => unknown) =>
		selector({ actionButtons: mockActionButtons, translations: mockTranslations })
}));

const { BehaviorSubject, ReplaySubject } = jest.requireActual('rxjs');
let mockSubscriptions = new BehaviorSubject([{ t: 'c', roles: ['owner'] }]);
let mockPermissionRecords = new BehaviorSubject([] as { id: string; roles: string[] }[]);
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return {
				get: (table: string) => ({
					query: () => ({
						observeWithColumns: () => (table === 'subscriptions' ? mockSubscriptions : mockPermissionRecords)
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

const useMessageBox = (rid?: string) =>
	useAppActionButtons({ filters: [{ context: UIActionButtonContext.MESSAGE_BOX_ACTION }], rid })[0];

describe('useAppActionButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockActionButtons = [];
		mockSubscriptions = new BehaviorSubject([{ t: 'c', roles: ['owner'] }]);
		mockPermissionRecords = new BehaviorSubject([]);
		mockUserRoles = ['user'];
		mockLanguage = 'en';
	});

	it('subscribes to the apps stream while mounted', () => {
		const unsubscribe = jest.fn();
		mockSubscribeToApps.mockReturnValueOnce(unsubscribe);

		const { unmount } = renderHook(() => useMessageBox('rid'));

		expect(mockSubscribeToApps).toHaveBeenCalledTimes(1);
		unmount();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('returns nothing until the room is resolved', () => {
		mockActionButtons = [button()];
		mockSubscriptions = new ReplaySubject(1);

		const { result } = renderHook(() => useMessageBox('rid'));

		expect(result.current).toEqual([]);

		act(() => mockSubscriptions.next([{ t: 'c', roles: [] }]));

		expect(result.current).toHaveLength(1);
	});

	it('labels a button with the app translation for the active locale', async () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0]).toMatchObject({ id: 'app-id/summarize', label: 'Summarize thread' });
	});

	it('drops the previous room buttons until the new room resolves', async () => {
		mockActionButtons = [button()];

		const { result, rerender } = renderHook(({ rid }: { rid: string }) => useMessageBox(rid), { initialProps: { rid: 'rid' } });

		await waitFor(() => expect(result.current).toHaveLength(1));

		mockSubscriptions = new ReplaySubject(1);
		rerender({ rid: 'other-rid' });

		expect(result.current).toEqual([]);

		act(() => mockSubscriptions.next([{ t: 'c', roles: [] }]));

		expect(result.current).toHaveLength(1);
	});

	it('keeps only the requested context', async () => {
		mockActionButtons = [button(), button({ actionId: 'other', context: UIActionButtonContext.ROOM_ACTION })];

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('summarize');
	});

	it('separates the ai category from the default one', async () => {
		mockActionButtons = [button(), button({ actionId: 'ai-one', category: 'ai' })];

		const { result } = renderHook(
			() =>
				useAppActionButtons({ filters: [{ context: UIActionButtonContext.MESSAGE_BOX_ACTION, category: 'ai' }], rid: 'rid' })[0]
		);

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('ai-one');
	});

	it('drops a button whose room type does not match', async () => {
		mockActionButtons = [
			button({ when: { roomTypes: ['direct'] } }),
			button({ actionId: 'channel-only', when: { roomTypes: ['public_channel'] } })
		];

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('channel-only');
	});

	it('hides a room-type button when there is no room', async () => {
		mockActionButtons = [
			button({ context: UIActionButtonContext.USER_DROPDOWN_ACTION }),
			button({ actionId: 'room-only', context: UIActionButtonContext.USER_DROPDOWN_ACTION, when: { roomTypes: ['direct'] } })
		];

		const { result } = renderHook(
			() => useAppActionButtons({ filters: [{ context: UIActionButtonContext.USER_DROPDOWN_ACTION }] })[0]
		);

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('summarize');
	});

	it('resolves a permission against the roles the subscription and the user hold', async () => {
		mockActionButtons = [button({ when: { hasOnePermission: ['pin-message'] } })];
		mockPermissionRecords.next([{ id: 'pin-message', roles: ['owner'] }]);

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));

		act(() => mockPermissionRecords.next([{ id: 'pin-message', roles: ['admin'] }]));

		expect(result.current).toEqual([]);
	});

	it('hides a role-gated button when the subscription loses the role', async () => {
		mockActionButtons = [button({ when: { hasOneRole: ['owner'] } })];

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(1));

		act(() => mockSubscriptions.next([{ t: 'c', roles: [] }]));

		expect(result.current).toEqual([]);
	});

	it('shows a room-type button once the subscription is created', async () => {
		mockActionButtons = [button({ when: { roomTypes: ['direct'] } })];
		mockSubscriptions.next([]);

		const { result } = renderHook(() => useMessageBox('rid'));

		expect(result.current).toEqual([]);

		act(() => mockSubscriptions.next([{ t: 'd', roles: [] }]));

		expect(result.current).toHaveLength(1);
	});

	it('keeps every category when the filter names none', async () => {
		mockActionButtons = [button(), button({ actionId: 'ai-one', category: 'ai' })];

		const { result } = renderHook(() => useMessageBox('rid'));

		await waitFor(() => expect(result.current).toHaveLength(2));
	});

	it('returns one list per filter', async () => {
		mockActionButtons = [button(), button({ actionId: 'ai-room', context: UIActionButtonContext.ROOM_ACTION, category: 'ai' })];

		const { result } = renderHook(() =>
			useAppActionButtons({
				filters: [
					{ context: UIActionButtonContext.ROOM_ACTION, category: 'ai' },
					{ context: UIActionButtonContext.MESSAGE_BOX_ACTION }
				],
				rid: 'rid'
			})
		);

		await waitFor(() => expect(result.current[0]).toHaveLength(1));
		expect(result.current[0][0].button.actionId).toBe('ai-room');
		expect(result.current[1][0].button.actionId).toBe('summarize');
	});
});
