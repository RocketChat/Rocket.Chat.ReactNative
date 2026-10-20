import { act, renderHook } from '@testing-library/react-native';
import { Q } from '@nozbe/watermelondb';
import { Subject as MockSubject } from 'rxjs';

import { type TSubscriptionModel } from '~/definitions';
import { useSubscriptions } from '../useSubscriptions';
import { type TRoomTypeFilter } from '../useRoomTypeFilter';

const mockState = {
	settings: { UI_Use_Real_Name: false },
	server: { server: 'https://open.rocket.chat' },
	login: { user: { roles: ['livechat-agent'] } },
	sortPreferences: { sortBy: 'activity', showUnread: false, showFavorites: false, groupByType: false },
	enterpriseModules: []
};

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)
}));

const mockQueries: { clauses: unknown[]; columns: string[]; emissions: MockSubject<TSubscriptionModel[]> }[] = [];

jest.mock('~/lib/database', () => ({
	active: {
		get: () => ({
			query: (...clauses: unknown[]) => ({
				observeWithColumns: (columns: string[]) => {
					const emissions = new MockSubject<TSubscriptionModel[]>();
					mockQueries.push({ clauses, columns, emissions });
					return emissions;
				}
			})
		})
	}
}));

const latestQuery = () => mockQueries[mockQueries.length - 1];

const flushQuerySetup = () => act(() => Promise.resolve());

const renderSubscriptions = (roomTypeFilter?: TRoomTypeFilter) =>
	renderHook(
		({ collapsedGroups }: { collapsedGroups: ReadonlySet<string> }) => useSubscriptions(collapsedGroups, roomTypeFilter),
		{
			initialProps: { collapsedGroups: new Set<string>() }
		}
	);

const directMessagesClause = Q.where('t', 'd');
const withoutDirectMessagesClause = Q.where('t', Q.notEq('d'));

describe('RoomsListView useSubscriptions', () => {
	beforeEach(() => {
		mockQueries.length = 0;
	});

	it('watches unread counts only while a section is collapsed', async () => {
		const { rerender } = renderSubscriptions();
		await flushQuerySetup();
		expect(latestQuery().columns).not.toContain('unread');

		rerender({ collapsedGroups: new Set(['inProgress']) });
		await flushQuerySetup();

		expect(latestQuery().columns).toEqual(
			expect.arrayContaining(['unread', 'user_mentions', 'group_mentions', 'tunread', 'tunread_user', 'tunread_group'])
		);
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

	it('queries every room type by default', async () => {
		renderSubscriptions();
		await flushQuerySetup();

		expect(latestQuery().clauses).not.toContainEqual(directMessagesClause);
		expect(latestQuery().clauses).not.toContainEqual(withoutDirectMessagesClause);
	});

	it('queries only direct messages when asked to', async () => {
		renderSubscriptions('directMessages');
		await flushQuerySetup();

		expect(latestQuery().clauses).toContainEqual(directMessagesClause);
	});

	it('leaves direct messages out when asked to', async () => {
		renderSubscriptions('withoutDirectMessages');
		await flushQuerySetup();

		expect(latestQuery().clauses).toContainEqual(withoutDirectMessagesClause);
	});
});
