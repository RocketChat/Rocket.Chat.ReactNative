import { ActionTypes, ModalActions } from '~/containers/UIKit/interfaces';
import { triggerAction } from '../actions';
import { triggerBlockAction, triggerCancel, triggerSubmitView } from '../triggerActions';

jest.mock('../actions', () => ({
	triggerAction: jest.fn()
}));

const mockedTriggerAction = triggerAction as jest.MockedFunction<typeof triggerAction>;

describe('triggerActions wrappers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('triggerSubmitView', () => {
		const submitInput = {
			viewId: 'view-id',
			appId: 'app-id',
			payload: {
				view: {
					id: 'view-id',
					state: {}
				}
			}
		};

		it('passes submit payload to triggerAction', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.UPDATE);

			await triggerSubmitView(submitInput as any);

			expect(mockedTriggerAction).toHaveBeenCalledWith({
				type: ActionTypes.SUBMIT,
				...submitInput
			});
		});

		it('asks to close when triggerAction returns modal.close', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.CLOSE);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(true);
		});

		it('asks to close when triggerAction returns nothing', async () => {
			mockedTriggerAction.mockResolvedValueOnce(undefined);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(true);
		});

		it('keeps the modal open for modal.update', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.UPDATE);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(false);
		});

		it('keeps the modal open for modal.open', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.OPEN);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(false);
		});
	});

	it('passes cancel payload to triggerAction', () => {
		const input = {
			view: { id: 'view-id' },
			appId: 'app-id',
			viewId: 'view-id',
			isCleared: false
		};

		triggerCancel(input as any);

		expect(mockedTriggerAction).toHaveBeenCalledWith({
			type: ActionTypes.CLOSED,
			...input
		});
	});

	it('passes block action payload to triggerAction', () => {
		const input = {
			actionId: 'action-id',
			appId: 'app-id',
			container: { type: 'message', id: 'container-id' },
			value: 'value',
			rid: 'room-id',
			mid: 'message-id',
			blockId: 'block-id'
		};

		triggerBlockAction(input as any);

		expect(mockedTriggerAction).toHaveBeenCalledWith({
			type: ActionTypes.ACTION,
			...input
		});
	});
});
