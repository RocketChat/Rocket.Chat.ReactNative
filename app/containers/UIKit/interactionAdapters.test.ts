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
