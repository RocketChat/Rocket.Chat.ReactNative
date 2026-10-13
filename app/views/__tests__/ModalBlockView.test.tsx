import { act, render, screen } from '@testing-library/react-native';
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
import { ModalActions } from '~/containers/UIKit/interfaces';
import { triggerBlockAction, triggerSubmitView } from '~/lib/apps/triggerActions';

let mockBlockAction: (action: { actionId: string; value: unknown; blockId: string }) => Promise<void>;
jest.mock('~/containers/UIKit/MessageBlock', () => ({
	ModalBlockWithContext: ({ action }: { action: typeof mockBlockAction }) => {
		mockBlockAction = action;
		return null;
	}
}));
jest.mock('~/containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: ReactNode }) => children,
		Item: ({ onPress, testID }: { onPress: () => void; testID: string }) => ReactActual.createElement('Item', { onPress, testID })
	};
});
jest.mock('~/lib/apps/triggerActions', () => ({
	triggerBlockAction: jest.fn(),
	triggerCancel: jest.fn(),
	triggerSubmitView: jest.fn()
}));

const modalData = (triggerId: string) => ({
	appId: 'app-id',
	viewId: 'view-id',
	triggerId,
	view: {
		id: 'view-id',
		title: { type: 'plain_text', text: 'Title' },
		close: { type: 'plain_text', text: 'Cancel' },
		submit: { type: 'plain_text', text: 'Submit' },
		blocks: []
	}
});

type TNavigation = { replace: jest.Mock; setOptions: jest.Mock; goBack: jest.Mock };

const mockNavigation = (): TNavigation => ({ replace: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() });

const renderModal = (data: ReturnType<typeof modalData>, navigation: TNavigation) => (
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
		const navigation = mockNavigation();
		const { rerender } = render(renderModal(modalData('trigger-1'), navigation));

		const reopened = modalData('trigger-2');
		rerender(renderModal(reopened, navigation));

		expect(navigation.replace).toHaveBeenCalledWith('ModalBlockView', { data: reopened });
	});

	describe('closing', () => {
		const renderHeader = (navigation: TNavigation) => {
			render(renderModal(modalData('trigger-1'), navigation));
			const { headerLeft, headerRight } = navigation.setOptions.mock.calls[0][0];
			render(
				<>
					{headerLeft()}
					{headerRight()}
				</>
			);
		};

		it('closes once the app accepts the submit', async () => {
			jest.mocked(triggerSubmitView).mockResolvedValueOnce(true);
			const navigation = mockNavigation();
			renderHeader(navigation);

			await act(() => screen.getByTestId('submit-modal-uikit').props.onPress());

			expect(navigation.goBack).toHaveBeenCalledTimes(1);
		});

		it('stays open when the app keeps the modal after a submit', async () => {
			jest.mocked(triggerSubmitView).mockResolvedValueOnce(false);
			const navigation = mockNavigation();
			renderHeader(navigation);

			await act(() => screen.getByTestId('submit-modal-uikit').props.onPress());

			expect(navigation.goBack).not.toHaveBeenCalled();
		});

		it('goes back only once when cancelled while a submit that closes is pending', async () => {
			let resolveSubmit: (value: boolean) => void = () => {};
			jest.mocked(triggerSubmitView).mockReturnValueOnce(
				new Promise(resolve => {
					resolveSubmit = resolve;
				})
			);
			const navigation = mockNavigation();
			renderHeader(navigation);

			const submitting = screen.getByTestId('submit-modal-uikit').props.onPress();
			await act(() => screen.getByTestId('close-modal-uikit').props.onPress());
			await act(async () => {
				resolveSubmit(true);
				await submitting;
			});

			expect(navigation.goBack).toHaveBeenCalledTimes(1);
		});

		it('closes when a block action answers with modal.close', async () => {
			jest.mocked(triggerBlockAction).mockResolvedValueOnce(ModalActions.CLOSE);
			const navigation = mockNavigation();
			render(renderModal(modalData('trigger-1'), navigation));

			await act(() => mockBlockAction({ actionId: 'action-id', value: 'value', blockId: 'block-id' }));

			expect(navigation.goBack).toHaveBeenCalledTimes(1);
		});

		it('stays open when a block action does not close the modal', async () => {
			jest.mocked(triggerBlockAction).mockResolvedValueOnce(undefined);
			const navigation = mockNavigation();
			render(renderModal(modalData('trigger-1'), navigation));

			await act(() => mockBlockAction({ actionId: 'action-id', value: 'value', blockId: 'block-id' }));

			expect(navigation.goBack).not.toHaveBeenCalled();
		});
	});
});
