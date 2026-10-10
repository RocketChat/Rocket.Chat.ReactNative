import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { connectSuccess, disconnect } from '~/actions/connect';
import { setActiveUsers } from '~/actions/activeUsers';
import I18n from '~/i18n';
import { createMockedStore } from '~/reducers/mockedStore';
import useStatusAccessibilityLabel from '../useStatusAccessibilityLabel';

const renderStatusLabel = (roomUserId: string | null, type: string) => {
	const store = createMockedStore();
	const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	let renders = 0;
	const hook = renderHook(
		() => {
			renders += 1;
			return useStatusAccessibilityLabel({ roomUserId, type, isGroupChat: false });
		},
		{ wrapper }
	);
	return { store, hook, renderCount: () => renders };
};

describe('useStatusAccessibilityLabel', () => {
	it('does not re-render a room without a peer user when the connection changes', () => {
		const { store, hook, renderCount } = renderStatusLabel(null, 'c');
		const rendersBefore = renderCount();

		act(() => {
			store.dispatch(connectSuccess());
		});
		act(() => {
			store.dispatch(disconnect());
		});

		expect(renderCount()).toBe(rendersBefore);
		expect(hook.result.current).toBe(I18n.t('Public_channel'));
	});

	it('follows the peer presence of a direct message', () => {
		const { store, hook } = renderStatusLabel('peer-id', 'd');

		act(() => {
			store.dispatch(connectSuccess());
			store.dispatch(setActiveUsers({ 'peer-id': { status: 'busy', statusText: '' } }));
		});

		expect(hook.result.current).toBe(I18n.t('Busy'));
	});
});
