import { act, renderHook } from '@testing-library/react-native';
import { Subject as MockSubject } from 'rxjs';

import { type TSubscriptionModel } from '~/definitions';
import { useSubscriptions } from '../useSubscriptions';

const mockState = {
	settings: { UI_Use_Real_Name: false },
	server: { server: 'https://open.rocket.chat', connected: false },
	login: { user: { roles: ['livechat-agent'] } },
	sortPreferences: { sortBy: 'activity', showUnread: false, showFavorites: false, groupByType: false },
	enterpriseModules: []
};

const UNREAD_STATE_COLUMNS = ['alert', 'unread', 'tunread', 'hide_unread_status'];

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)
}));

const mockQueries: { database: string; columns: string[]; emissions: MockSubject<TSubscriptionModel[]> }[] = [];
const mockActiveDatabaseListeners = new Set<() => void>();

const mockOpenDatabase = (name: string) => ({
	get: () => ({
		query: () => ({
			observeWithColumns: (columns: string[]) => {
				const emissions = new MockSubject<TSubscriptionModel[]>();
				mockQueries.push({ database: name, columns, emissions });
				return emissions;
			}
		})
	})
});

let mockActiveDatabase = mockOpenDatabase('https://open.rocket.chat');

jest.mock('~/lib/database', () => ({
	get active() {
		return mockActiveDatabase;
	},
	subscribeToActiveDB: (listener: () => void) => {
		mockActiveDatabaseListeners.add(listener);
		return () => mockActiveDatabaseListeners.delete(listener);
	}
}));

const switchActiveDatabase = (name: string) => {
	mockActiveDatabase = mockOpenDatabase(name);
	mockActiveDatabaseListeners.forEach(listener => listener());
};

const latestQuery = () => mockQueries[mockQueries.length - 1];

const flushQuerySetup = () => act(() => Promise.resolve());

const renderSubscriptions = () =>
	renderHook(({ collapsedGroups }: { collapsedGroups: ReadonlySet<string> }) => useSubscriptions(collapsedGroups), {
		initialProps: { collapsedGroups: new Set<string>() }
	});

describe('RoomsListView useSubscriptions', () => {
	beforeEach(() => {
		mockQueries.length = 0;
		mockActiveDatabase = mockOpenDatabase('https://open.rocket.chat');
		mockState.server = { server: 'https://open.rocket.chat', connected: false };
		mockState.login.user.roles = ['livechat-agent'];
		mockState.sortPreferences.showUnread = false;
	});

	it('watches unread counts of an ungrouped list only while a section is collapsed', async () => {
		mockState.login.user.roles = [];
		const { rerender } = renderSubscriptions();
		await flushQuerySetup();
		expect(latestQuery().columns).not.toContain('unread');

		rerender({ collapsedGroups: new Set(['inProgress']) });
		await flushQuerySetup();

		expect(latestQuery().columns).toEqual(
			expect.arrayContaining(['unread', 'user_mentions', 'group_mentions', 'tunread', 'tunread_user', 'tunread_group'])
		);
	});

	it('watches the unread state of rooms while grouping, with every section expanded', async () => {
		mockState.login.user.roles = [];
		mockState.sortPreferences.showUnread = true;
		renderSubscriptions();
		await flushQuerySetup();

		expect(latestQuery().columns).toEqual(expect.arrayContaining(UNREAD_STATE_COLUMNS));
	});

	it('watches the unread state of rooms in the omnichannel sections, with every section expanded', async () => {
		renderSubscriptions();
		await flushQuerySetup();

		expect(latestQuery().columns).toEqual(expect.arrayContaining(UNREAD_STATE_COLUMNS));
	});

	it('keeps showing the list while re-querying after a section collapses', async () => {
		const { result, rerender } = renderSubscriptions();
		await flushQuerySetup();
		act(() => latestQuery().emissions.next([]));
		expect(result.current.loading).toBe(false);

		rerender({ collapsedGroups: new Set(['inProgress']) });
		await flushQuerySetup();

		expect(result.current.loading).toBe(false);
	});

	it('keeps the list on screen while the active server connects', async () => {
		const { result, rerender } = renderSubscriptions();
		await flushQuerySetup();
		act(() => latestQuery().emissions.next([]));

		mockState.server = { ...mockState.server, connected: true };
		rerender({ collapsedGroups: new Set<string>() });
		await flushQuerySetup();

		expect(result.current.loading).toBe(false);
		expect(mockQueries).toHaveLength(1);
	});

	it('shows loading and re-queries when the active database switches', async () => {
		const openRoom = { rid: 'open-room', name: 'open-room', t: 'c' } as TSubscriptionModel;
		const otherRoom = { rid: 'other-room', name: 'other-room', t: 'c' } as TSubscriptionModel;
		const { result } = renderSubscriptions();
		await flushQuerySetup();
		act(() => latestQuery().emissions.next([openRoom]));

		act(() => switchActiveDatabase('https://other.rocket.chat'));
		await flushQuerySetup();

		expect(result.current.loading).toBe(true);
		expect(latestQuery().database).toBe('https://other.rocket.chat');

		act(() => latestQuery().emissions.next([otherRoom]));
		expect(result.current.loading).toBe(false);
		expect(result.current.subscriptions).toContain(otherRoom);
		expect(result.current.subscriptions).not.toContain(openRoom);
	});
});
