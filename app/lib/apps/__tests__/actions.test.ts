import { ActionTypes, ModalActions } from '~/containers/UIKit/interfaces';
import { handlePayloadUserInteraction, triggerAction, withTriggerId } from '../actions';
import EventEmitter from '~/lib/methods/helpers/events';
import fetch from '~/lib/methods/helpers/fetch';
import Navigation from '~/lib/navigation/appNavigation';
import { showToast } from '~/lib/methods/helpers/showToast';

jest.mock('~/lib/methods/helpers', () => ({
	random: jest.fn(() => 'trigger-fixed-id')
}));

jest.mock('~/lib/methods/helpers/fetch', () => jest.fn());

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
		it('returns undefined when trigger id is unknown', () => {
			expect(handlePayloadUserInteraction(ModalActions.OPEN, { triggerId: 'unknown', viewId: 'view-id' })).toBeUndefined();
		});

		it('navigates for modal.open and returns modal.open', async () => {
			let result;
			let triggerId = '';
			await withTriggerId('app-id', async id => {
				triggerId = id;
				result = handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, view: { id: 'view-id' } });
			});

			expect(result).toBe(ModalActions.OPEN);
			expect(mockedNavigate).toHaveBeenCalledWith('ModalBlockView', {
				data: expect.objectContaining({
					appId: 'app-id',
					triggerId,
					viewId: 'view-id'
				})
			});
		});

		it('emits modal.close to the view', async () => {
			let result;
			await withTriggerId('app-id', async triggerId => {
				result = handlePayloadUserInteraction(ModalActions.CLOSE, { triggerId, viewId: 'view-id' });
			});

			expect(result).toBe(ModalActions.CLOSE);
			expect(mockedEmit).toHaveBeenCalledWith('view-id', expect.objectContaining({ type: ModalActions.CLOSE }));
		});

		it('accepts a stream reply that arrives after the request settled', async () => {
			let triggerId = '';
			await withTriggerId('app-id', async id => {
				triggerId = id;
			});

			expect(handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, viewId: 'view-id' })).toBe(ModalActions.OPEN);
		});

		it('drops a stream reply once the trigger expired', async () => {
			let triggerId = '';
			await withTriggerId('app-id', async id => {
				triggerId = id;
			});
			jest.advanceTimersByTime(5000);

			expect(handlePayloadUserInteraction(ModalActions.OPEN, { triggerId, viewId: 'view-id' })).toBeUndefined();
		});
	});

	describe('triggerAction', () => {
		const actionInput = {
			type: ActionTypes.ACTION,
			actionId: 'action-id',
			appId: 'app-id',
			container: { type: 'message', id: 'container-id' } as const,
			mid: 'message-id',
			rid: 'room-id',
			blockId: 'block-id',
			value: 'value'
		};

		it('handles modal.open response', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: ModalActions.OPEN,
							triggerId: 'trigger-fixed-id',
							view: { id: 'view-open-id' }
						})
					)
			} as Response);

			const result = await triggerAction(actionInput);

			expect(result).toBe(ModalActions.OPEN);
			expect(mockedNavigate).toHaveBeenCalledWith('ModalBlockView', {
				data: expect.objectContaining({
					appId: 'app-id',
					triggerId: 'trigger-fixed-id',
					viewId: 'view-open-id'
				})
			});
			expect(mockedFetch).toHaveBeenCalledWith(
				'https://chat.example.com/api/apps/ui.interaction/app-id/',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'X-Auth-Token': 'auth-token',
						'X-User-Id': 'user-id'
					})
				})
			);
		});

		it('handles modal.update response', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: ModalActions.UPDATE,
							triggerId: 'trigger-fixed-id',
							viewId: 'view-update-id'
						})
					)
			} as Response);

			const result = await triggerAction(actionInput);

			expect(result).toBe(ModalActions.UPDATE);
			expect(mockedEmit).toHaveBeenCalledWith(
				'view-update-id',
				expect.objectContaining({
					type: ModalActions.UPDATE,
					appId: 'app-id',
					triggerId: 'trigger-fixed-id',
					viewId: 'view-update-id'
				})
			);
		});

		it('handles errors response', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: ModalActions.ERRORS,
							triggerId: 'trigger-fixed-id',
							viewId: 'view-errors-id'
						})
					)
			} as Response);

			const result = await triggerAction(actionInput);

			expect(result).toBe(ModalActions.ERRORS);
			expect(mockedEmit).toHaveBeenCalledWith(
				'view-errors-id',
				expect.objectContaining({
					type: ModalActions.ERRORS,
					appId: 'app-id',
					triggerId: 'trigger-fixed-id',
					viewId: 'view-errors-id'
				})
			);
		});

		it('handles a reply that arrives after the stream trigger timeout', async () => {
			mockedFetch.mockImplementationOnce(async () => {
				jest.advanceTimersByTime(6000);
				return {
					ok: true,
					text: () =>
						Promise.resolve(JSON.stringify({ type: ModalActions.OPEN, triggerId: 'trigger-fixed-id', view: { id: 'slow-view' } }))
				} as Response;
			});

			try {
				await expect(triggerAction(actionInput)).resolves.toBe(ModalActions.OPEN);
				expect(mockedNavigate).toHaveBeenCalledTimes(1);
			} finally {
			}
		});

		it('returns modal.close for explicit close response', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: ModalActions.CLOSE
						})
					)
			} as Response);

			const result = await triggerAction(actionInput);

			expect(result).toBe(ModalActions.CLOSE);
		});

		it('returns modal.close for empty response body with ok status', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve('')
			} as Response);

			const result = await triggerAction(actionInput);

			expect(result).toBe(ModalActions.CLOSE);
		});

		it('throws when request is not ok', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: false,
				status: 500
			} as Response);

			await expect(triggerAction(actionInput)).rejects.toThrow('Failed to POST /api/apps/ui.interaction/app-id/: 500');
		});

		it('throws when response body is malformed JSON', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve('{invalid json}')
			} as Response);

			await expect(triggerAction(actionInput)).rejects.toThrow('Invalid JSON response from server');
		});

		it('shows a toast for an unsupported surface this client cannot render', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: 'contextual_bar.open',
							triggerId: 'trigger-fixed-id'
						})
					)
			} as Response);

			await expect(triggerAction(actionInput)).resolves.toBeUndefined();
			expect(showToast).toHaveBeenCalledTimes(1);
		});

		it('reports no action when an app only acknowledges the interaction', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify({ success: true }))
			} as Response);

			await expect(triggerAction(actionInput)).resolves.toBeUndefined();
		});

		it('reports the stream reply when the app acknowledged after answering over the stream', async () => {
			mockedFetch.mockImplementationOnce(async () => {
				handlePayloadUserInteraction(ModalActions.UPDATE, { triggerId: 'trigger-fixed-id', viewId: 'view-id' });
				return { ok: true, text: () => Promise.resolve(JSON.stringify({ success: true })) } as Response;
			});

			await expect(triggerAction(actionInput)).resolves.toBe(ModalActions.UPDATE);
		});

		it('invalidates trigger id after processing', async () => {
			mockedFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							type: ModalActions.UPDATE,
							triggerId: 'trigger-fixed-id',
							viewId: 'view-id'
						})
					)
			} as Response);

			await triggerAction(actionInput);

			const staleResult = handlePayloadUserInteraction(ModalActions.UPDATE, {
				triggerId: 'trigger-fixed-id',
				viewId: 'view-id'
			});

			expect(staleResult).toBeUndefined();
		});
	});
});
