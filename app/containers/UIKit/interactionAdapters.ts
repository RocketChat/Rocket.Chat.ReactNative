import type { ServerInteraction, UserInteraction } from '@rocket.chat/ui-kit';

import { ActionTypes, type ITriggerAction, type IView } from './interfaces';

type TServerModalInteraction = Extract<ServerInteraction, { type: 'modal.open' | 'modal.update' | 'modal.close' | 'errors' }>;
type TServerModalInteractionType = TServerModalInteraction['type'];

const assertViewId = (viewId?: string) => {
	if (!viewId) {
		throw new Error('viewId is required for view interactions');
	}

	return viewId;
};

const toActionButtonInteraction = ({
	actionId,
	rid,
	tmid,
	payload,
	triggerId
}: Pick<ITriggerAction, 'actionId' | 'rid' | 'tmid' | 'payload'> & { triggerId: string }): UserInteraction => {
	if (!actionId || !rid) {
		throw new Error('actionId and rid are required for actionButton interaction');
	}
	if (payload?.context === 'roomAction') {
		return { type: 'actionButton', actionId, payload: { context: 'roomAction' }, rid, triggerId };
	}
	if (payload?.context === 'messageBoxAction') {
		return {
			type: 'actionButton',
			actionId,
			payload: { context: 'messageBoxAction', message: payload.message ?? '' },
			tmid,
			rid,
			triggerId
		};
	}
	throw new Error(`Unsupported actionButton context: ${payload?.context}`);
};

/**
 * Converts a trigger action to a user interaction
 */
export const toUserInteraction = ({
	type,
	actionId,
	blockId,
	value,
	container,
	mid,
	rid,
	tmid,
	triggerId,
	viewId,
	payload,
	view,
	isCleared
}: ITriggerAction & { triggerId: string }): UserInteraction => {
	if (type === ActionTypes.ACTION_BUTTON) {
		return toActionButtonInteraction({ actionId, rid, tmid, payload, triggerId });
	}

	if (type === ActionTypes.ACTION) {
		if (!actionId || !container) {
			throw new Error('actionId and container are required for blockAction interaction');
		}

		const blockPayload = {
			blockId: blockId || 'default',
			value: payload ?? value
		};

		if (container.type === 'message') {
			if (!mid || !rid) {
				throw new Error('mid and rid are required for message block actions');
			}

			return {
				type: 'blockAction',
				actionId,
				payload: blockPayload,
				container: {
					type: 'message',
					id: container.id
				},
				mid,
				rid,
				triggerId
			};
		}

		return {
			type: 'blockAction',
			actionId,
			payload: blockPayload,
			container: {
				type: 'view',
				id: container.id
			},
			triggerId
		};
	}

	if (type === ActionTypes.SUBMIT) {
		return {
			type: 'viewSubmit',
			viewId: assertViewId(viewId),
			payload: payload as any,
			triggerId
		};
	}

	return {
		type: 'viewClosed',
		payload: {
			viewId: assertViewId(viewId),
			view: view as IView & { id: string; state: { [blockId: string]: { [key: string]: unknown } } },
			isCleared
		},
		triggerId
	};
};

/**
 * Converts a server modal interaction type to a user interaction type
 * @param {string} value - The server modal interaction type to convert
 * @returns {TServerModalInteractionType | null} - The user interaction type
 */
export const toServerModalInteractionType = (value: string): TServerModalInteractionType | null => {
	if (value === 'modal.open' || value === 'modal.update' || value === 'modal.close' || value === 'errors') {
		return value;
	}

	return null;
};
