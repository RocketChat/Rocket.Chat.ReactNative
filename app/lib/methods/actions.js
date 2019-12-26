import random from '../../utils/random';
import EventEmitter from '../../utils/events';
import Navigation from '../Navigation';

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

const handlePayloadUserInteraction = (type, { viewId = 'lero', triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}

	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	if (!viewId) {
		return;
	}

	if ([MODAL_ACTIONS.UPDATE].includes(type)) {
		EventEmitter.emit(viewId, {
			triggerId,
			viewId,
			appId: appId || data.blocks[0].appId,
			...data
		});
	}

	if ([MODAL_ACTIONS.OPEN].includes(type)) {
		Navigation.navigate('ModalBlockView', {
			data: {
				triggerId,
				viewId,
				appId: appId || data.blocks[0].appId,
				...data
			}
		});
	}
};

export async function triggerAction({
	actionId, appId, rid, mid, ...rest
}) {
	const triggerId = generateTriggerId(appId);

	const payload = rest.payload || rest;

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const { type: interactionType, ...data } = await this.sdk.post(`apps/blockit/${ appId }/`, {
		type: ACTION_TYPES.ACTION,
		actionId,
		payload,
		mid,
		rid,
		triggerId
	});

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
