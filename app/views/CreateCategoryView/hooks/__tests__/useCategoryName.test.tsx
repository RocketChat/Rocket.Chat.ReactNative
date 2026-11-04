import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import I18n from '~/i18n';
import { createMockedStore } from '~/reducers/mockedStore';
import { useCategoryName } from '../useCategoryName';

const work = { _id: 'work', name: 'Work' };
const home = { _id: 'home', name: 'Home' };

const renderCategoryName = (initialName: string, editedCategoryId: string) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://a.rocket.chat', version: '8.9.0', name: 'A' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: [work] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useCategoryName(initialName, editedCategoryId), { wrapper: Wrapper });
	return { store, result };
};

it('rejects a name taken by a category added after the screen opened', () => {
	const { store, result } = renderCategoryName('Work', 'work');

	act(() => {
		store.dispatch(setUser({ sidebarCategories: [work, home] }));
	});
	act(() => {
		result.current.setName('home');
	});

	expect(result.current.error).toBe(I18n.t('A_category_with_this_name_already_exists'));
	expect(result.current.isValid).toBe(false);
});

it('accepts the edited category keeping its own name', () => {
	const { result } = renderCategoryName('Work', 'work');

	act(() => {
		result.current.setName('work');
	});

	expect(result.current.error).toBeUndefined();
});

it('keeps accepting the name of the category being created once it is saved', () => {
	const { store, result } = renderCategoryName('Home', 'home');

	act(() => {
		store.dispatch(setUser({ sidebarCategories: [work, home] }));
	});

	expect(result.current.error).toBeUndefined();
	expect(result.current.isValid).toBe(true);
});
