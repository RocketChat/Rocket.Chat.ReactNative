import { ContainerTypes, ModalActions } from '~/containers/UIKit/interfaces';
import I18n from '~/i18n';
import {
	clearTriggers,
	handlePayloadUserInteraction,
	triggerAppActionButton,
	triggerBlockAction,
	triggerSubmitView,
	withTriggerId
} from '../actions';
import EventEmitter from '~/lib/methods/helpers/events';
import fetch from '~/lib/methods/helpers/fetch';
import Navigation from '~/lib/navigation/appNavigation';
import { showToast } from '~/lib/methods/helpers/showToast';

jest.mock('~/lib/methods/helpers/random', () => ({
	random: jest.fn(() => 'trigger-fixed-id')
}));

jest.mock('~/lib/methods/helpers/fetch', () => jest.fn());

jest.mock('~/lib/methods/helpers/log', () => jest.fn());

jest.mock('~/lib/methods/helpers/events', () => ({
	emit: jest.fn()
}));

jest.mock('~/lib/methods/helpers/showToast', () => ({
	showToast: jest.fn()
}));

jest.mock('~/lib/navigation/appNavigation', () => ({
	navigate: jest.fn()
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		currentLogin: {
			userId: 'user-id',
			authToken: 'auth-token'
		},
		host: 'https://chat.example.com'
	}
}));

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockedEmit = EventEmitter.emit as jest.MockedFunction<typeof EventEmitter.emit>;
const mockedNavigate = Navigation.navigate as jest.MockedFunction<typeof Navigation.navigate>;

const triggerId = 'trigger-fixed-id';

const reply = (body: unknown = '') =>
	({ ok: true, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) }) as Response;

const replyAfterStream = (streamType: string, streamData: Record<string, unknown>, body: unknown = '') =>
	mockedFetch.mockImplementationOnce(async () => {
		handlePayloadUserInteraction(streamType, { triggerId, ...streamData });
		return reply(body);
	});

const submit = () => triggerSubmitView({ viewId: 'view-id', appId: 'app-id', payload: { view: { id: 'view-id', state: {} } } });

const blockAction = () =>
	triggerBlockAction({
		actionId: 'action-id',
		appId: 'app-id',
		container: { type: ContainerTypes.VIEW, id: 'view-id' },
		value: 'value'
	});

describe('actions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('handlePayloadUserInteraction', () => {
		it('ignores an unknown trigger id', () => {
			handlePayloadUserInteraction(ModalActions.OPEN, { triggerId: 'unknown', viewId: 'view-id' });

			expect(mockedNavigate).not.toHaveBeenCalled();
			expect(mockedEmit).not.toHaveBeenCalled();
			expect(showToast).not.toHaveBeenCalled();
		});

		it('navigates for modal.open', async () => {
			await withTriggerId('app-id', async id => {
				handlePayloadUserInteraction(ModalActions.OPEN, { triggerId: id, view: { id: 'view-id' } });
			});

			expect(mockedNavigate).toHaveBeenCalledWith('ModalBlockView', {
				data: expect.objectContaining({ appId: 'app-id', triggerId, viewId: 'view-id' })
			});
		});

		it('accepts a stream reply that arrives after the request settled', async () => {
			await withTriggerId('app-id', async () => {});

			handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, viewId: 'view-id' });

			expect(mockedNavigate).toHaveBeenCalledWith('ModalBlockView', {
				data: expect.objectContaining({ triggerId, viewId: 'view-id' })
			});
		});

		it('closes the open modal when the stream closes it after the request settled', async () => {
			await withTriggerId('app-id', async () => {});

			handlePayloadUserInteraction(ModalActions.CLOSE, { triggerId, viewId: 'view-id' });

			expect(mockedEmit).toHaveBeenCalledWith('view-id', {
				type: ModalActions.CLOSE,
				triggerId,
				appId: 'app-id',
				viewId: 'view-id'
			});
		});

		it('drops a stream reply once the trigger expired', async () => {
			await withTriggerId('app-id', async () => {});
			jest.advanceTimersByTime(5000);

			handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, viewId: 'view-id' });

			expect(mockedNavigate).not.toHaveBeenCalled();
		});

		it('drops a reply that arrives after the session was cleared', async () => {
			mockedFetch.mockImplementationOnce(async () => {
				clearTriggers();
				return reply({ type: ModalActions.OPEN, triggerId, view: { id: 'view-id' } });
			});

			await blockAction();

			expect(mockedNavigate).not.toHaveBeenCalled();
		});
	});

	describe('triggerSubmitView', () => {
		it.each([
			['modal.close', { type: ModalActions.CLOSE }, true],
			['an acknowledgement', { success: true }, true],
			['a surface mobile cannot show', { type: 'contextual_bar.open', triggerId }, true],
			['an empty body', '', false],
			['errors', { type: ModalActions.ERRORS, triggerId, viewId: 'view-id', errors: {} }, false],
			['modal.update', { type: ModalActions.UPDATE, triggerId, viewId: 'view-id' }, false],
			['modal.open', { type: ModalActions.OPEN, triggerId, view: { id: 'other-view-id' } }, false],
			['contextual_bar.update', { type: 'contextual_bar.update', triggerId }, false]
		])('answered with %s closes the modal: %s', async (_reply, body, shouldClose) => {
			mockedFetch.mockResolvedValueOnce(reply(body));

			await expect(submit()).resolves.toBe(shouldClose);
		});

		it('closes the modal when the stream closes it before the request settles', async () => {
			replyAfterStream(ModalActions.CLOSE, { appId: 'app-id' });

			await expect(submit()).resolves.toBe(true);
		});

		it('keeps the modal open when the app acknowledged after updating it over the stream', async () => {
			replyAfterStream(ModalActions.UPDATE, { viewId: 'view-id' }, { success: true });

			await expect(submit()).resolves.toBe(false);
		});

		it('keeps the modal open for errors on a trigger the stream already used', async () => {
			replyAfterStream('banner.open', {}, { type: ModalActions.ERRORS, triggerId, viewId: 'view-id', errors: {} });

			await expect(submit()).resolves.toBe(false);
		});

		it('ignores a stream modal.open once the app closed the modal over HTTP', async () => {
			mockedFetch.mockResolvedValueOnce(reply({ type: ModalActions.CLOSE }));
			await submit();

			handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, view: { id: 'other-view-id' } });

			expect(mockedNavigate).not.toHaveBeenCalled();
		});

		it('shows the unsupported toast for a contextual bar update', async () => {
			mockedFetch.mockResolvedValueOnce(reply({ type: 'contextual_bar.update', triggerId }));

			await submit();

			expect(showToast).toHaveBeenCalledWith(I18n.t('App_action_unsupported'));
		});
	});

	describe('triggerBlockAction', () => {
		it.each([
			['modal.close', { type: ModalActions.CLOSE }, true],
			['modal.update', { type: ModalActions.UPDATE, triggerId, viewId: 'view-id' }, false],
			['an acknowledgement', { success: true }, false],
			['an empty body', '', false]
		])('answered with %s closes the modal: %s', async (_reply, body, shouldClose) => {
			mockedFetch.mockResolvedValueOnce(reply(body));

			await expect(blockAction()).resolves.toBe(shouldClose);
		});

		it('posts to the app and opens the modal it replies with', async () => {
			mockedFetch.mockResolvedValueOnce(reply({ type: ModalActions.OPEN, triggerId, view: { id: 'view-open-id' } }));

			await blockAction();

			expect(mockedFetch).toHaveBeenCalledWith(
				'https://chat.example.com/api/apps/ui.interaction/app-id/',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({ 'X-Auth-Token': 'auth-token', 'X-User-Id': 'user-id' })
				})
			);
			expect(mockedNavigate).toHaveBeenCalledWith('ModalBlockView', {
				data: expect.objectContaining({ appId: 'app-id', triggerId, viewId: 'view-open-id' })
			});
		});

		it.each([ModalActions.UPDATE, ModalActions.ERRORS])('sends %s to the open modal', async type => {
			mockedFetch.mockResolvedValueOnce(reply({ type, triggerId, viewId: 'view-id' }));

			await blockAction();

			expect(mockedEmit).toHaveBeenCalledWith(
				'view-id',
				expect.objectContaining({ type, appId: 'app-id', triggerId, viewId: 'view-id' })
			);
		});

		it('sends a reply the stream already delivered only once', async () => {
			replyAfterStream(ModalActions.UPDATE, { viewId: 'view-id' }, { type: ModalActions.UPDATE, triggerId, viewId: 'view-id' });

			await blockAction();
			handlePayloadUserInteraction(ModalActions.UPDATE, { triggerId, viewId: 'view-id' });

			expect(mockedEmit).toHaveBeenCalledTimes(1);
		});

		it('throws when the request is not ok', async () => {
			mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 } as Response);

			await expect(blockAction()).rejects.toThrow('Failed to POST /api/apps/ui.interaction/app-id/: 500');
		});

		it('throws when the response body is malformed JSON', async () => {
			mockedFetch.mockResolvedValueOnce(reply('{invalid json}'));

			await expect(blockAction()).rejects.toThrow('Invalid JSON response from server');
		});
	});

	describe('triggerAppActionButton', () => {
		const button = { appId: 'app-id', actionId: 'action-id', labelI18n: 'label' };

		const postedInteraction = () => JSON.parse(mockedFetch.mock.calls[0][1]?.body as string);

		it('posts a message box action button with the composer text', async () => {
			mockedFetch.mockResolvedValueOnce(reply());

			await triggerAppActionButton({
				button: { ...button, context: 'messageBoxAction' },
				rid: 'room-id',
				tmid: 'thread-id',
				message: 'draft'
			});

			expect(postedInteraction()).toEqual({
				type: 'actionButton',
				actionId: 'action-id',
				rid: 'room-id',
				tmid: 'thread-id',
				triggerId,
				payload: { context: 'messageBoxAction', message: 'draft' }
			});
		});

		it('posts a room action button without thread or message', async () => {
			mockedFetch.mockResolvedValueOnce(reply());

			await triggerAppActionButton({ button: { ...button, context: 'roomAction' }, rid: 'room-id', tmid: 'thread-id' });

			expect(postedInteraction()).toEqual({
				type: 'actionButton',
				actionId: 'action-id',
				rid: 'room-id',
				triggerId,
				payload: { context: 'roomAction' }
			});
		});

		it('shows an error toast when the app action fails', async () => {
			mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 } as Response);

			await triggerAppActionButton({ button: { ...button, context: 'roomAction' }, rid: 'room-id' });

			expect(showToast).toHaveBeenCalledWith(I18n.t('App_action_error'));
		});
	});
});
