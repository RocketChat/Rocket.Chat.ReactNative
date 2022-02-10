import random from '../../utils/random';
import EventEmitter from '../../utils/events';
import fetch from '../../utils/fetch';
import Navigation from '../Navigation';
import {
	ActionTypes,
	ITriggerAction,
	ITriggerBlockAction,
	ITriggerCancel,
	ITriggerSubmitView,
	IUserInteraction,
	ModalActions
} from '../../containers/UIKit/interfaces';
import { TRocketChat, IRocketChat } from '../../definitions/IRocketChat';

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

export const handlePayloadUserInteraction = (
	type: ModalActions,
	{ triggerId, ...data }: IUserInteraction
): ModalActions | undefined => {
	if (!triggersId.has(triggerId)) {
		return;
	}

	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	const { view } = data;
	let { viewId } = data;

	if (view && view.id) {
		viewId = view.id;
	}

	if (!viewId) {
		return;
	}

	if ([ModalActions.ERRORS].includes(type)) {
		EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
		return ModalActions.ERRORS;
	}

	if ([ModalActions.UPDATE].includes(type)) {
		EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
		return ModalActions.UPDATE;
	}

	if ([ModalActions.OPEN].includes(type) || [ModalActions.MODAL].includes(type)) {
		Navigation.navigate('ModalBlockView', {
			data: {
				triggerId,
				viewId,
				appId,
				...data
			}
		});
		return ModalActions.OPEN;
	}

	return ModalActions.CLOSE;
};

export function triggerAction(
	this: IRocketChat,
	{ type, actionId, appId, rid, mid, viewId, container, ...rest }: ITriggerAction
) {
	return new Promise<ModalActions | undefined | void>(async (resolve, reject) => {
		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		try {
			const { userId, authToken } = this.sdk.currentLogin;
			const { host } = this.sdk.client;

			// we need to use fetch because this.sdk.post add /v1 to url
			const result = await fetch(`${host}/api/apps/ui.interaction/${appId}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Auth-Token': authToken,
					'X-User-Id': userId
				},
				body: JSON.stringify({
					type,
					actionId,
					payload,
					container,
					mid,
					rid,
					triggerId,
					viewId
				})
			});

			try {
				const { type: interactionType, ...data } = await result.json();
				return resolve(handlePayloadUserInteraction(interactionType, data));
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

export default function triggerBlockAction(this: TRocketChat | IRocketChat, options: ITriggerBlockAction) {
	return triggerAction.call(this as IRocketChat, { type: ActionTypes.ACTION, ...options });
}

export async function triggerSubmitView(this: TRocketChat | IRocketChat, { viewId, ...options }: ITriggerSubmitView) {
	const result = await triggerAction.call(this as IRocketChat, { type: ActionTypes.SUBMIT, viewId, ...options });
	if (!result || ModalActions.CLOSE === result) {
		Navigation.back();
	}
}

export function triggerCancel(this: TRocketChat | IRocketChat, { view, ...options }: ITriggerCancel) {
	return triggerAction.call(this as IRocketChat, { type: ActionTypes.CLOSED, view, ...options });
}
