import { ActionTypes } from './interfaces';
import { toServerModalInteractionType, toUserInteraction } from './interactionAdapters';

describe('interactionAdapters', () => {
	describe('toUserInteraction', () => {
		it('maps message block action with required metadata', () => {
			const interaction = toUserInteraction({
				type: ActionTypes.ACTION,
				actionId: 'action-id',
				blockId: 'block-id',
				value: 'old-value',
				payload: 'new-value',
				container: { type: 'message', id: 'container-id' },
				mid: 'message-id',
				rid: 'room-id',
				triggerId: 'trigger-id'
			});

			expect(interaction).toEqual({
				type: 'blockAction',
				actionId: 'action-id',
				payload: {
					blockId: 'block-id',
					value: 'new-value'
				},
				container: {
					type: 'message',
					id: 'container-id'
				},
				mid: 'message-id',
				rid: 'room-id',
				triggerId: 'trigger-id'
			});
		});

		it('maps view block action and defaults blockId', () => {
			const interaction = toUserInteraction({
				type: ActionTypes.ACTION,
				actionId: 'action-id',
				container: { type: 'view', id: 'view-id' },
				value: 'value',
				triggerId: 'trigger-id'
			});

			expect(interaction).toEqual({
				type: 'blockAction',
				actionId: 'action-id',
				payload: {
					blockId: 'default',
					value: 'value'
				},
				container: {
					type: 'view',
					id: 'view-id'
				},
				triggerId: 'trigger-id'
			});
		});

		it('throws when submit interaction has no viewId', () => {
			expect(() =>
				toUserInteraction({
					type: ActionTypes.SUBMIT,
					payload: { view: { id: 'view-id', state: {} } },
					triggerId: 'trigger-id'
				} as any)
			).toThrow('viewId is required for view interactions');
		});

		it('throws when close interaction has no viewId', () => {
			expect(() =>
				toUserInteraction({
					type: ActionTypes.CLOSED,
					view: { id: 'view-id', state: {} as any } as any,
					triggerId: 'trigger-id'
				} as any)
			).toThrow('viewId is required for view interactions');
		});

		it('maps a message box action button and keeps the composer text', () => {
			const interaction = toUserInteraction({
				type: ActionTypes.ACTION_BUTTON,
				actionId: 'action-id',
				appId: 'app-id',
				rid: 'room-id',
				tmid: 'thread-id',
				payload: { context: 'messageBoxAction', message: 'draft' },
				triggerId: 'trigger-id'
			});

			expect(interaction).toEqual({
				type: 'actionButton',
				actionId: 'action-id',
				payload: { context: 'messageBoxAction', message: 'draft' },
				mid: undefined,
				tmid: 'thread-id',
				rid: 'room-id',
				triggerId: 'trigger-id'
			});
		});

		it('maps a room action button', () => {
			const interaction = toUserInteraction({
				type: ActionTypes.ACTION_BUTTON,
				actionId: 'action-id',
				appId: 'app-id',
				rid: 'room-id',
				payload: { context: 'roomAction' },
				triggerId: 'trigger-id'
			});

			expect(interaction).toEqual({
				type: 'actionButton',
				actionId: 'action-id',
				payload: { context: 'roomAction' },
				mid: undefined,
				tmid: undefined,
				rid: 'room-id',
				triggerId: 'trigger-id'
			});
		});

		it('throws when an action button has no context', () => {
			expect(() =>
				toUserInteraction({
					type: ActionTypes.ACTION_BUTTON,
					actionId: 'action-id',
					rid: 'room-id',
					triggerId: 'trigger-id'
				})
			).toThrow('actionId and payload.context are required for actionButton interaction');
		});
	});

	describe('toServerModalInteractionType', () => {
		it('returns known modal interaction types', () => {
			expect(toServerModalInteractionType('modal.open')).toBe('modal.open');
			expect(toServerModalInteractionType('modal.update')).toBe('modal.update');
			expect(toServerModalInteractionType('modal.close')).toBe('modal.close');
			expect(toServerModalInteractionType('errors')).toBe('errors');
		});

		it('returns null for unknown interaction type', () => {
			expect(toServerModalInteractionType('some.other.type')).toBeNull();
		});
	});
});
