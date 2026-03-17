import { type ServerInteraction } from '@rocket.chat/ui-kit';

import { type ITriggerAction, ModalActions, type TModalAction } from '../../containers/UIKit/interfaces';
import { toServerModalInteractionType, toUserInteraction } from '../../containers/UIKit/interactionAdapters';
import EventEmitter from './helpers/events';
import fetch from './helpers/fetch';
import { random } from './helpers';
import Navigation from '../navigation/appNavigation';
import sdk from '../services/sdk';

const triggersId = new Map();

const invalidateTriggerId = (id: string) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const generateTriggerId = (appId?: string): string => {
	const triggerId = random(17);
	triggersId.set(triggerId, appId);

	return triggerId;
};

type THandledServerInteractionType = Extract<ServerInteraction, { type: 'modal.open' | 'modal.update' | 'errors' }>['type'];
type THandledServerPayload = {
	triggerId: string;
	viewId?: string;
	view?: { id?: string };
	appId?: string;
	[key: string]: unknown;
};

export const handlePayloadUserInteraction = (
	type: THandledServerInteractionType,
	{ triggerId, ...data }: THandledServerPayload
): TModalAction | undefined => {
	if (!triggersId.has(triggerId)) {
		return;
	}

	if (!invalidateTriggerId(triggerId)) {
		return;
	}

	const { view } = data;
	let { viewId } = data as { viewId?: string };

	if (view && view.id) {
		viewId = view.id;
	}

	if (!viewId) {
		return;
	}

	if (type === ModalActions.ERRORS) {
		EventEmitter.emit(viewId, {
			...data,
			type,
			triggerId,
			viewId
		} as any);
		return ModalActions.ERRORS;
	}

	if (type === ModalActions.UPDATE) {
		EventEmitter.emit(viewId, {
			...data,
			type,
			triggerId
		} as any);
		return ModalActions.UPDATE;
	}

	if (type === ModalActions.OPEN) {
		Navigation.navigate('ModalBlockView', {
			data: {
				...data,
				triggerId,
				viewId
			}
		});
		return ModalActions.OPEN;
	}

	return ModalActions.CLOSE;
};

export function triggerAction({ type, actionId, appId, rid, mid, viewId, container, ...rest }: ITriggerAction) {
	return new Promise<TModalAction | undefined | void>(async (resolve, reject) => {
		const triggerId = generateTriggerId(appId);
		const payload = rest.payload || rest.value;

		try {
			const { userId, authToken } = sdk.current.currentLogin;
			const { host } = sdk.current.client;
			const interaction = toUserInteraction({
				type,
				actionId,
				appId,
				rid,
				mid,
				viewId,
				container,
				payload,
				blockId: rest.blockId,
				value: rest.value,
				view: rest.view,
				isCleared: rest.isCleared,
				triggerId
			});

			// we need to use fetch because this.sdk.post add /v1 to url
			const result = await fetch(`${host}/api/apps/ui.interaction/${appId}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Auth-Token': authToken,
					'X-User-Id': userId
				},
				body: JSON.stringify(interaction)
			});

			try {
				const { type: interactionType, ...data } = await result.json();
				const modalType = toServerModalInteractionType(interactionType);
				if (!modalType || modalType === ModalActions.CLOSE) {
					return resolve(ModalActions.CLOSE);
				}

				return resolve(handlePayloadUserInteraction(modalType, data));
			} catch (e) {
				// modal.close has no body, so result.json will fail
				// but it returns ok status
				if (result.ok) {
					return resolve();
				}
			}
		} catch (e) {
			// do nothing
		}
		return reject();
	});
}
