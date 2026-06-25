import { ActionTypes, ModalActions } from '../../containers/UIKit/interfaces';
import Navigation from '../navigation/appNavigation';
import { triggerAction } from './actions';
import { triggerBlockAction, triggerCancel, triggerSubmitView } from './triggerActions';

jest.mock('../navigation/appNavigation', () => ({
	back: jest.fn()
}));

jest.mock('./actions', () => ({
	triggerAction: jest.fn()
}));

const mockedTriggerAction = triggerAction as jest.MockedFunction<typeof triggerAction>;
const mockedBack = Navigation.back as jest.MockedFunction<typeof Navigation.back>;

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

		it('goes back when triggerAction returns undefined', async () => {
			mockedTriggerAction.mockResolvedValueOnce(undefined);

			await triggerSubmitView(submitInput as any);

			expect(mockedBack).toHaveBeenCalledTimes(1);
		});

		it('goes back when triggerAction returns modal.close', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.CLOSE);

			await triggerSubmitView(submitInput as any);

			expect(mockedBack).toHaveBeenCalledTimes(1);
		});

		it('does not go back for modal.update', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.UPDATE);

			await triggerSubmitView(submitInput as any);

			expect(mockedBack).not.toHaveBeenCalled();
		});

		it('does not go back for modal.open', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.OPEN);

			await triggerSubmitView(submitInput as any);

			expect(mockedBack).not.toHaveBeenCalled();
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
