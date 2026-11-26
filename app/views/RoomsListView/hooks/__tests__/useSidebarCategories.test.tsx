import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setPreference, setUser } from '~/actions/login';
import { addSettings } from '~/actions/settings';
import { createMockedStore } from '~/reducers/mockedStore';
import { useSidebarCategories } from '../useSidebarCategories';

const renderSectionsOrder = ({
	adminSectionsOrder,
	userSectionsOrder
}: {
	adminSectionsOrder?: string[];
	userSectionsOrder?: string[];
}) => {
	const store = createMockedStore();
	store.dispatch(addSettings({ Accounts_Default_User_Preferences_sidebarSectionsOrder: adminSectionsOrder }));
	store.dispatch(setUser({ settings: { preferences: { sidebarSectionsOrder: userSectionsOrder } } }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useSidebarCategories(), { wrapper: Wrapper });
	return { store, result };
};

it("orders sections by the user's own preference over the admin default", () => {
	const { result } = renderSectionsOrder({
		adminSectionsOrder: ['Favorites', 'Conversations'],
		userSectionsOrder: ['Conversations', 'Favorites']
	});

	expect(result.current.sectionsOrder).toEqual(['Conversations', 'Favorites']);
});

it('falls back to the admin default when the user has no sections order', () => {
	const { result } = renderSectionsOrder({ adminSectionsOrder: ['Favorites', 'Conversations'] });

	expect(result.current.sectionsOrder).toEqual(['Favorites', 'Conversations']);
});

it('follows a sections order changed on another device', () => {
	const { store, result } = renderSectionsOrder({ adminSectionsOrder: ['Favorites', 'Conversations'] });

	act(() => {
		store.dispatch(setPreference({ sidebarSectionsOrder: ['Conversations', 'Favorites'] }));
	});

	expect(result.current.sectionsOrder).toEqual(['Conversations', 'Favorites']);
});
