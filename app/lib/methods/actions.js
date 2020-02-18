import random from '../../utils/random';
import EventEmitter from '../../utils/events';
import fetch from '../../utils/fetch';
import Navigation from '../Navigation';

const ACTION_TYPES = {
	ACTION: 'blockAction',
	SUBMIT: 'viewSubmit',
	CLOSED: 'viewClosed'
};

export const MODAL_ACTIONS = {
	MODAL: 'modal',
	OPEN: 'modal.open',
	CLOSE: 'modal.close',
	UPDATE: 'modal.update',
	ERRORS: 'errors'
};

export const CONTAINER_TYPES = {
	VIEW: 'view',
	MESSAGE: 'message'
};

const triggersId = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const generateTriggerId = (appId) => {
	const triggerId = random(17);
	triggersId.set(triggerId, appId);

	return triggerId;
};

export const handlePayloadUserInteraction = (type, { triggerId, ...data }) => {
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

	if ([MODAL_ACTIONS.ERRORS].includes(type)) {
		EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
		return MODAL_ACTIONS.ERRORS;
	}

	if ([MODAL_ACTIONS.UPDATE].includes(type)) {
		EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
		return MODAL_ACTIONS.UPDATE;
	}


	if ([MODAL_ACTIONS.OPEN].includes(type) || [MODAL_ACTIONS.MODAL].includes(type)) {
		Navigation.navigate('ModalBlockView', {
			data: {
				triggerId,
				viewId,
				appId,
				...data
			}
		});
		return MODAL_ACTIONS.OPEN;
	}

	return MODAL_ACTIONS.CLOSE;
};

export function triggerAction({
	type, actionId, appId, rid, mid, viewId, container, ...rest
}) {
	return new Promise(async(resolve, reject) => {
		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		try {
			const { userId, authToken } = this.sdk.currentLogin;
			const { host } = this.sdk.client;

			// we need to use fetch because this.sdk.post add /v1 to url
			const result = await fetch(`${ host }/api/apps/ui.interaction/${ appId }/`, {
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

export default function triggerBlockAction(options) {
	return triggerAction.call(this, { type: ACTION_TYPES.ACTION, ...options });
}

export async function triggerSubmitView({ viewId, ...options }) {
	const result = await triggerAction.call(this, { type: ACTION_TYPES.SUBMIT, viewId, ...options });
	if (!result || MODAL_ACTIONS.CLOSE === result) {
		Navigation.back();
	}
}

export function triggerCancel({ view, ...options }) {
	return triggerAction.call(this, { type: ACTION_TYPES.CLOSED, view, ...options });
}
