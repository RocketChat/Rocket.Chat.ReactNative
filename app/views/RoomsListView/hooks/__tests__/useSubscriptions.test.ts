import { act, renderHook } from '@testing-library/react-native';
import { Subject as MockSubject } from 'rxjs';

import { type TSubscriptionModel } from '~/definitions';
import { useSubscriptions } from '../useSubscriptions';

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

const mockQueries: { columns: string[]; emissions: MockSubject<TSubscriptionModel[]> }[] = [];

jest.mock('~/lib/database', () => ({
	active: {
		get: () => ({
			query: () => ({
				observeWithColumns: (columns: string[]) => {
					const emissions = new MockSubject<TSubscriptionModel[]>();
					mockQueries.push({ columns, emissions });
					return emissions;
				}
			})
		})
	}
}));

const latestQuery = () => mockQueries[mockQueries.length - 1];

const flushQuerySetup = () => act(() => Promise.resolve());

const renderSubscriptions = () =>
	renderHook(({ collapsedGroups }: { collapsedGroups: ReadonlySet<string> }) => useSubscriptions(collapsedGroups), {
		initialProps: { collapsedGroups: new Set<string>() }
	});

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
});
