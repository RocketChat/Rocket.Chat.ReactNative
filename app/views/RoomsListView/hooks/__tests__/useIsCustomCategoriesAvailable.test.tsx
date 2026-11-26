import { renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { selectServerSuccess } from '~/actions/server';
import { createMockedStore } from '~/reducers/mockedStore';
import { useIsCustomCategoriesAvailable } from '../useSidebarCategories';

const renderAvailability = ({ version, hasValidLicense }: { version: string; hasValidLicense: boolean }) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version, name: 'Open' }));
	store.dispatch(setEnterpriseModules(['teams-voip'], hasValidLicense));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	return renderHook(() => useIsCustomCategoriesAvailable(), { wrapper: Wrapper }).result.current;
};

it('is available on 8.9.0 with a valid license', () => {
	expect(renderAvailability({ version: '8.9.0', hasValidLicense: true })).toBe(true);
});

it('is unavailable on 8.9.0 without a valid license', () => {
	expect(renderAvailability({ version: '8.9.0', hasValidLicense: false })).toBe(false);
});

it('is unavailable before 8.9.0 even with a valid license', () => {
	expect(renderAvailability({ version: '8.8.1', hasValidLicense: true })).toBe(false);
});
