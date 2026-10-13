import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import ModalBlockView from '../ModalBlockView';
import { mockedStore } from '~/reducers/mockedStore';

jest.mock(
	'~/containers/KeyboardView',
	() =>
		({ children }: { children: ReactNode }) =>
			children
);
jest.mock('~/containers/UIKit/MessageBlock', () => ({ ModalBlockWithContext: () => null }));
jest.mock('~/containers/Header/components/HeaderButton', () => ({ Container: () => null, Item: () => null }));
jest.mock('~/lib/apps/triggerActions', () => ({
	triggerBlockAction: jest.fn(),
	triggerCancel: jest.fn(),
	triggerSubmitView: jest.fn()
}));

const modalData = (triggerId: string) => ({
	appId: 'app-id',
	viewId: 'view-id',
	triggerId,
	view: { id: 'view-id', title: { type: 'plain_text', text: 'Title' }, blocks: [] }
});

const renderModal = (data: ReturnType<typeof modalData>, navigation: { replace: jest.Mock; setOptions: jest.Mock }) => (
	<Provider store={mockedStore}>
		<ModalBlockView
			theme='light'
			navigation={navigation as any}
			route={{ key: 'modal', name: 'ModalBlockView', params: { data } } as any}
		/>
	</Provider>
);

describe('ModalBlockView', () => {
	it('replaces itself when an app reopens the modal with the same view id', () => {
		const navigation = { replace: jest.fn(), setOptions: jest.fn() };
		const { rerender } = render(renderModal(modalData('trigger-1'), navigation));

		const reopened = modalData('trigger-2');
		rerender(renderModal(reopened, navigation));

		expect(navigation.replace).toHaveBeenCalledWith('ModalBlockView', { data: reopened });
	});
});
