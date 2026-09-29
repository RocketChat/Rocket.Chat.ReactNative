import { type ServerInteraction } from '@rocket.chat/ui-kit';

import { type ITriggerAction, ModalActions, type TModalAction } from '~/containers/UIKit/interfaces';
import { toServerModalInteractionType, toUserInteraction } from '~/containers/UIKit/interactionAdapters';
import EventEmitter from '~/lib/methods/helpers/events';
import { random } from '~/lib/methods/helpers';
import Navigation from '~/lib/navigation/appNavigation';
import { appsApiFetch } from '~/lib/services/appsApiFetch';

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

	const triggerAppId = invalidateTriggerId(triggerId);
	const payloadAppId = data.appId ?? triggerAppId;
	if (!payloadAppId) {
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
			appId: payloadAppId,
			type,
			triggerId,
			viewId
		} as any);
		return ModalActions.ERRORS;
	}

	if (type === ModalActions.UPDATE) {
		EventEmitter.emit(viewId, {
			...data,
			appId: payloadAppId,
			type,
			triggerId,
			viewId
		} as any);
		return ModalActions.UPDATE;
	}

	if (type === ModalActions.OPEN) {
		Navigation.navigate('ModalBlockView', {
			data: {
				...data,
				appId: payloadAppId,
				triggerId,
				viewId
			}
		});
		return ModalActions.OPEN;
	}

	return ModalActions.CLOSE;
};

export async function triggerAction({
	type,
	actionId,
	appId,
	rid,
	mid,
	tmid,
	viewId,
	container,
	...rest
}: ITriggerAction): Promise<TModalAction | undefined | void> {
	const triggerId = generateTriggerId(appId);
	const payload = rest.payload ?? rest.value;

	try {
		const interaction = toUserInteraction({
			type,
			actionId,
			appId,
			rid,
			mid,
			tmid,
			viewId,
			container,
			payload,
			blockId: rest.blockId,
			value: rest.value,
			view: rest.view,
			isCleared: rest.isCleared,
			triggerId
		});

		const result = await appsApiFetch(`ui.interaction/${appId}/`, { method: 'POST', body: interaction });
		const text = await result.text();
		if (!text || text.trim() === '') {
			// modal.close has no body, but returns ok status
			return ModalActions.CLOSE;
		}

		let parsed: { type?: string; [key: string]: unknown };
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error('Invalid JSON response from server');
		}

		const { type: interactionType, ...data } = parsed;
		const modalType = toServerModalInteractionType(interactionType ?? '');
		if (!modalType) {
			if (interactionType) {
				return ModalActions.UNSUPPORTED;
			}
			return;
		}
		if (modalType === ModalActions.CLOSE) {
			return ModalActions.CLOSE;
		}

		return handlePayloadUserInteraction(modalType, data as THandledServerPayload);
	} catch (e) {
		throw e instanceof Error ? e : new Error('Failed to trigger action');
	} finally {
		invalidateTriggerId(triggerId);
	}
}
