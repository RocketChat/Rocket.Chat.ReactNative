import RNUserDefaults from 'rn-user-defaults';

import random from '../../utils/random';
import EventEmitter from '../../utils/events';
import Navigation from '../Navigation';
import RocketChat from '../rocketchat';

const TRIGGER_TIMEOUT = 5000;

const ACTION_TYPES = {
	ACTION: 'blockAction',
	SUBMIT: 'viewSubmit',
	CANCEL: 'viewCancel'
};

const MODAL_ACTIONS = {
	OPEN: 'modal',
	CLOSE: 'modal.close',
	UPDATE: 'modal.update'
};

const triggersId = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

const generateTriggerId = (appId) => {
	const triggerId = random(17);
	triggersId.set(triggerId, appId);
	return triggerId;
};

const handlePayloadUserInteraction = (type, { triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}

	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	// TODO not sure this will always have 'view.id'
	const { view: { id: viewId } } = data;
	if (!viewId) {
		return;
	}

	if ([MODAL_ACTIONS.UPDATE].includes(type)) {
		EventEmitter.emit(viewId, {
			triggerId,
			viewId,
			appId,
			...data
		});
	}


	if ([MODAL_ACTIONS.OPEN].includes(type)) {
		Navigation.navigate('ModalBlockView', {
			data: {
				triggerId,
				viewId,
				appId,
				...data
			}
		});
	}
};

export async function triggerAction({
	type, actionId, appId, rid, mid, ...rest
}) {
	const triggerId = generateTriggerId(appId);

	const payload = rest.payload || rest;

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const server = await RNUserDefaults.get('currentServer');
	const id = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
	const token = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ id }`);

	const result = await fetch(`${ server }/api/apps/uikit/${ appId }/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': id
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

	const { type: interactionType, ...data } = await result.json();

	handlePayloadUserInteraction(interactionType, data);
}

export default function triggerBlockAction(options) {
	return triggerAction.call(this, { type: ACTION_TYPES.ACTION, ...options });
}

export function triggerSubmitView({ viewId, ...options }) {
	try {
		return triggerAction.call(this, { type: ACTION_TYPES.SUBMIT, viewId, ...options });
	} catch (e) {
		console.log(e);
	}
}
