import {
	ActionTypes,
	ContainerTypes,
	type ITriggerBlockAction,
	type ITriggerSubmitView,
	ModalActions
} from '~/containers/UIKit/interfaces';
import { ACKNOWLEDGED, postUserInteraction, triggerAction } from '../actions';
import { triggerAppActionButton, triggerBlockAction, triggerSubmitView } from '../triggerActions';

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
		const submitInput: ITriggerSubmitView = {
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

			await triggerSubmitView(submitInput);

			expect(mockedTriggerAction).toHaveBeenCalledWith({
				type: ActionTypes.SUBMIT,
				...submitInput
			});
		});

		it('asks to close when triggerAction returns modal.close', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.CLOSE);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(true);
		});

		it('asks to close when the app acknowledges the submit', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ACKNOWLEDGED);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(true);
		});

		it('keeps the modal open when the server sends no reply', async () => {
			mockedTriggerAction.mockResolvedValueOnce(undefined);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(false);
		});

		it('keeps the modal open for errors', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.ERRORS);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(false);
		});

		it('keeps the modal open for modal.update', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.UPDATE);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(false);
		});

		it('keeps the modal for the app to replace when it opens another modal', async () => {
			mockedTriggerAction.mockResolvedValueOnce(ModalActions.OPEN);

			await expect(triggerSubmitView(submitInput)).resolves.toBe(false);
		});
	});

	it.each([
		[ModalActions.CLOSE, true],
		[ModalActions.UPDATE, false],
		[ACKNOWLEDGED, false],
		[undefined, false]
	])('reports whether a block action reply %s closes the view', async (reply, shouldClose) => {
		mockedTriggerAction.mockResolvedValueOnce(reply as Awaited<ReturnType<typeof triggerAction>>);

		const input: ITriggerBlockAction = {
			actionId: 'action-id',
			appId: 'app-id',
			container: { type: ContainerTypes.VIEW, id: 'view-id' },
			value: 'value'
		};

		await expect(triggerBlockAction(input)).resolves.toBe(shouldClose);
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
	});
});
