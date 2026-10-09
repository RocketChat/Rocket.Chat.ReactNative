import { ActionTypes, ModalActions } from '~/containers/UIKit/interfaces';
import { ACKNOWLEDGED, postUserInteraction, triggerAction } from '../actions';
import { triggerAppActionButton, triggerBlockAction, triggerCancel, triggerSubmitView } from '../triggerActions';

jest.mock('../actions', () => ({
	ACKNOWLEDGED: 'acknowledged',
	triggerAction: jest.fn(),
	postUserInteraction: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

const mockedTriggerAction = triggerAction as jest.MockedFunction<typeof triggerAction>;
const mockedPostUserInteraction = postUserInteraction as jest.MockedFunction<typeof postUserInteraction>;

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

		it('asks to close when the app acknowledges the submit', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ACKNOWLEDGED);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(true);
		});

		it('keeps the modal open when the server sends no reply', async () => {
			mockedTriggerAction.mockResolvedValueOnce(undefined);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(false);
		});

		it('keeps the modal open for errors', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.ERRORS);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(false);
		});

		it('keeps the modal open for modal.update', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.UPDATE);

			await expect(triggerSubmitView(submitInput as any)).resolves.toBe(false);
		});

		it('keeps the modal for the app to replace when it opens another modal', async () => {
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

	describe('triggerAppActionButton', () => {
		const button = { appId: 'app-id', actionId: 'action-id', labelI18n: 'label' };

		const buildInteraction = () => {
			const [appId, build] = mockedPostUserInteraction.mock.calls[0];
			return { appId, interaction: build('trigger-id') };
		};

		it('posts a message box action button with the composer text', async () => {
			await triggerAppActionButton({
				button: { ...button, context: 'messageBoxAction' },
				rid: 'room-id',
				tmid: 'thread-id',
				message: 'draft'
			});

			expect(buildInteraction()).toEqual({
				appId: 'app-id',
				interaction: {
					type: 'actionButton',
					actionId: 'action-id',
					rid: 'room-id',
					tmid: 'thread-id',
					triggerId: 'trigger-id',
					payload: { context: 'messageBoxAction', message: 'draft' }
				}
			});
		});

		it('posts a room action button without thread or message', async () => {
			await triggerAppActionButton({ button: { ...button, context: 'roomAction' }, rid: 'room-id', tmid: 'thread-id' });

			expect(buildInteraction().interaction).toEqual({
				type: 'actionButton',
				actionId: 'action-id',
				rid: 'room-id',
				triggerId: 'trigger-id',
				payload: { context: 'roomAction' }
			});
		});

		it('rejects an unsupported context', async () => {
			await triggerAppActionButton({ button: { ...button, context: 'messageAction' }, rid: 'room-id' });

			expect(() => buildInteraction()).toThrow('Unsupported actionButton context: messageAction');
		});
	});
});
