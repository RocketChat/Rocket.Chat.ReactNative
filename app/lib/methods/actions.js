import random from '../../utils/random';

const ACTION_TYPES = {
	ACTION: 'blockAction'
};

export async function triggerAction({
	actionId, appId, rid, mid, ...rest
}) {
	const triggerId = random(17);

	const payload = rest.payload || rest;

	const { type: interactionType, ...data } = await this.sdk.post(`apps/blockit/${ appId }/`, {
		type: ACTION_TYPES.ACTION,
		actionId,
		payload,
		mid,
		rid,
		triggerId
	});
	console.log(interactionType, data);
	return null;
}

export default function triggerBlockAction(options) {
	return triggerAction.call(this, { type: ACTION_TYPES.ACTION, ...options });
}
