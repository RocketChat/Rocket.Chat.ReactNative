import random from '../../utils/random';
import EventEmitter from '../../utils/events';
import Navigation from '../Navigation';
import { showErrorAlert } from '../../utils/info';
import I18n from '../../i18n';

const TRIGGER_TIMEOUT = 5000;

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

const triggersId = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const generateTriggerId = (appId) => {
	const triggerId = random(17);
	triggersId.set(triggerId, appId);
	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);
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

	// TODO not sure this will always have 'view.id'
	const { view: { id: viewId } = { id: '' } } = data;
	if (!viewId) {
		return;
	}

	if ([MODAL_ACTIONS.ERRORS].includes(type)) {
		return EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
	}

	if ([MODAL_ACTIONS.UPDATE].includes(type)) {
		return EventEmitter.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data
		});
	}


	if ([MODAL_ACTIONS.OPEN].includes(type) || [MODAL_ACTIONS.MODAL].includes(type)) {
		return Navigation.navigate('ModalBlockView', {
			data: {
				triggerId,
				viewId,
				appId,
				...data
			}
		});
	}
};

export function triggerAction({
	type, actionId, appId, rid, mid, ...rest
}) {
	return new Promise(async(resolve, reject) => {
		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		setTimeout(reject, TRIGGER_TIMEOUT, triggerId);

		const { userId, authToken } = this.sdk.currentLogin;
		const { host } = this.sdk.client;

		// we need to use fetch because this.sdk.post add /v1 to url
		const result = await fetch(`${ host }/api/apps/uikit/${ appId }/`, {
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
				mid,
				rid,
				triggerId
			})
		});

		try {
			const { type: interactionType, ...data } = await result.json();
			return resolve(handlePayloadUserInteraction(interactionType, data));
		} catch (e) {
			if (result.status !== 200) {
				showErrorAlert(I18n.t('Oops'));
				return reject();
			}
		}

		return resolve();
	});
}

export default function triggerBlockAction(options) {
	return triggerAction.call(this, { type: ACTION_TYPES.ACTION, ...options });
}

export function triggerSubmitView({ viewId, ...options }) {
	return triggerAction.call(this, { type: ACTION_TYPES.SUBMIT, viewId, ...options });
}

export function triggerCancel({ viewId, ...options }) {
	return triggerAction.call(this, { type: ACTION_TYPES.CLOSED, viewId, ...options });
}
