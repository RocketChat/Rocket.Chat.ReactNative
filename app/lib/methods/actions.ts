import { ITriggerAction, IUserInteraction, ModalActions } from '../../containers/UIKit/interfaces';
import EventEmitter from './helpers/events';
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

export function triggerAction({ type, actionId, appId, rid, mid, viewId, container, ...rest }: ITriggerAction) {
	return new Promise<ModalActions | undefined | void>(async (resolve, reject) => {
		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		try {
			const result = await sdk.post(`/apps/ui.interaction/${appId}/`, {
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
