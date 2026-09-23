import { renderHook, waitFor } from '@testing-library/react-native';

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

let mockSubscription: Record<string, unknown> | null = { t: 'c', roles: ['owner'] };
jest.mock('~/lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: () => Promise.resolve(mockSubscription)
}));

let mockPermissionRecords: { id: string; roles: string[] }[] = [];
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return {
				get: () => ({
					query: () => ({ fetch: () => Promise.resolve(mockPermissionRecords) })
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
		mockSubscription = { t: 'c', roles: ['owner'] };
		mockPermissionRecords = [];
		mockUserRoles = ['user'];
	});

	it('subscribes to the apps stream while mounted', () => {
		const unsubscribe = jest.fn();
		mockSubscribeToApps.mockReturnValueOnce(unsubscribe);

		const { unmount } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		expect(mockSubscribeToApps).toHaveBeenCalledTimes(1);
		unmount();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('returns nothing until the room is resolved', () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		expect(result.current).toEqual([]);
	});

	it('labels a button with the app translation for the active locale', async () => {
		mockActionButtons = [button()];

		const { result } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0]).toMatchObject({ id: 'app-id/summarize', label: 'Summarize thread' });
	});

	it('drops the previous room buttons until the new room resolves', async () => {
		mockActionButtons = [button()];

		const { result, rerender } = renderHook(
			({ rid }: { rid: string }) => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid }),
			{ initialProps: { rid: 'rid' } }
		);

		await waitFor(() => expect(result.current).toHaveLength(1));

		rerender({ rid: 'other-rid' });

		expect(result.current).toEqual([]);
		await waitFor(() => expect(result.current).toHaveLength(1));
	});

	it('keeps only the requested context', async () => {
		mockActionButtons = [button(), button({ actionId: 'other', context: UIActionButtonContext.ROOM_ACTION })];

		const { result } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('summarize');
	});

	it('separates the ai category from the default one', async () => {
		mockActionButtons = [button(), button({ actionId: 'ai-one', category: 'ai' })];

		const { result } = renderHook(() =>
			useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, category: 'ai', rid: 'rid' })
		);

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('ai-one');
	});

	it('drops a button whose room type does not match', async () => {
		mockActionButtons = [
			button({ when: { roomTypes: ['direct'] } }),
			button({ actionId: 'channel-only', when: { roomTypes: ['public_channel'] } })
		];

		const { result } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].button.actionId).toBe('channel-only');
	});

	it('resolves a permission against the roles the subscription and the user hold', async () => {
		mockActionButtons = [button({ when: { hasOnePermission: ['pin-message'] } })];
		mockPermissionRecords = [{ id: 'pin-message', roles: ['owner'] }];

		const { result } = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid' }));

		await waitFor(() => expect(result.current).toHaveLength(1));

		mockPermissionRecords = [{ id: 'pin-message', roles: ['admin'] }];
		const second = renderHook(() => useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid: 'rid-2' }));

		await waitFor(() => expect(second.result.current).toEqual([]));
	});
});
