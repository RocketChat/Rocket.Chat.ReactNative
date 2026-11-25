import { useState } from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { MessageBlock, ModalBlockWithContext } from '../MessageBlock';
import { mockedStore } from '~/reducers/mockedStore';

const missedCallCard = {
	appId: 'media-call-core',
	blockId: 'missed-call',
	type: 'info_card',
	rows: [
		{
			background: 'default',
			elements: [
				{ type: 'icon', icon: 'phone-off', variant: 'danger', framed: true },
				{ type: 'mrkdwn', text: '*Voice call not answered*' }
			]
		}
	]
};

const sectionBlock = { type: 'section', blockId: 'section', text: { type: 'plain_text', text: 'Section text' } };

const expectNoKeyWarning = (consoleError: jest.SpyInstance) =>
	expect(consoleError.mock.calls.flat().join(' ')).not.toContain('unique "key"');

describe('MessageBlock', () => {
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	it('renders several blocks without key warnings', () => {
		render(
			<Provider store={mockedStore}>
				<MessageBlock
					blocks={[missedCallCard, { type: 'divider', blockId: 'divider' }, { ...missedCallCard, blockId: 'second' }]}
					context={{ appId: 'media-call-core', rid: 'room-1', action: jest.fn() }}
				/>
			</Provider>
		);

		expect(screen.getAllByText('Voice call not answered')).toHaveLength(2);
		expectNoKeyWarning(consoleError);
	});

	it('renders modal blocks without key warnings', () => {
		render(
			<Provider store={mockedStore}>
				<ModalBlockWithContext blocks={[sectionBlock, { ...sectionBlock, blockId: 'second' }]} />
			</Provider>
		);

		expect(screen.getAllByText('Section text')).toHaveLength(2);
		expectNoKeyWarning(consoleError);
	});

	it('lets a modal radio take another option once its first action settles', async () => {
		const option = (value: string) => ({ text: { type: 'plain_text', text: value }, value });
		const blocks = [
			{
				type: 'input',
				blockId: 'question',
				label: { type: 'plain_text', text: 'Question' },
				element: { type: 'radio_button', actionId: 'q', options: [option('yes'), option('no')] }
			}
		];
		const Modal = () => {
			const [values, setValues] = useState({});
			const state = ({ actionId, value, blockId }: { actionId: string; value: string; blockId: string }) =>
				setValues(current => ({ ...current, [actionId]: { value, blockId } }));
			return <ModalBlockWithContext blocks={blocks} state={state} values={values} />;
		};
		render(
			<Provider store={mockedStore}>
				<Modal />
			</Provider>
		);

		act(() => {
			fireEvent.press(screen.getByTestId('uikit-radio-q-yes'));
		});
		await act(async () => {});

		expect(screen.getByTestId('uikit-radio-q-no')).not.toBeDisabled();
	});

	it('restores a message radio and re-enables it when its action is rejected', async () => {
		const yes = { text: { type: 'plain_text', text: 'Yes' }, value: 'yes' };
		const no = { text: { type: 'plain_text', text: 'No' }, value: 'no' };
		const blocks = [
			{
				type: 'actions',
				blockId: 'question',
				elements: [{ type: 'radio_button', actionId: 'q', initialOption: yes, options: [yes, no] }]
			}
		];
		const action = jest.fn().mockRejectedValue(new Error('offline'));
		render(
			<Provider store={mockedStore}>
				<MessageBlock blocks={blocks} context={{ appId: 'app', rid: 'room-1', action }} />
			</Provider>
		);

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-q-no')));

		expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'q', value: 'no' }));
		expect(screen.getByTestId('uikit-radio-q-yes')).toBeChecked();
		expect(screen.getByTestId('uikit-radio-q-no')).not.toBeChecked();
		expect(screen.getByTestId('uikit-radio-q-no')).not.toBeDisabled();
	});

	it('does not carry a radio selection over to a different radio that replaces it in the same block', async () => {
		const radioBlock = (actionId: string) => ({
			type: 'input',
			blockId: 'question',
			label: { type: 'plain_text', text: actionId },
			element: {
				type: 'radio_button',
				actionId,
				options: [
					{ text: { type: 'plain_text', text: 'Yes' }, value: 'yes' },
					{ text: { type: 'plain_text', text: 'No' }, value: 'no' }
				]
			}
		});
		const modal = (actionId: string) => (
			<Provider store={mockedStore}>
				<ModalBlockWithContext blocks={[radioBlock(actionId)]} state={jest.fn()} values={{}} />
			</Provider>
		);
		const { rerender } = render(modal('first'));

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-first-yes')));
		expect(screen.getByTestId('uikit-radio-first-yes')).toBeChecked();

		rerender(modal('second'));

		expect(screen.getByTestId('uikit-radio-second-yes')).not.toBeChecked();
	});
});
