import type { UserInteraction } from '@rocket.chat/ui-kit';

import { type ITriggerAction, ModalActions, type TModalAction } from '~/containers/UIKit/interfaces';
import { toServerModalInteractionType, toUserInteraction } from '~/containers/UIKit/interactionAdapters';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { showToast } from '~/lib/methods/helpers/showToast';
import { random } from '~/lib/methods/helpers';
import Navigation from '~/lib/navigation/appNavigation';
import { appsApiFetch } from '~/lib/services/appsApiFetch';

const TRIGGER_TIMEOUT = 5000;

export const ACKNOWLEDGED = 'acknowledged';

const triggers = new Map<string, { appId?: string; consumed?: boolean; handled?: TModalAction }>();

export const withTriggerId = async <T>(appId: string | undefined, request: (triggerId: string) => Promise<T>): Promise<T> => {
	const triggerId = random(17);
	triggers.set(triggerId, { appId });
	try {
		return await request(triggerId);
	} finally {
		setTimeout(() => {
			triggers.delete(triggerId);
		}, TRIGGER_TIMEOUT);
	}
};

type THandledServerPayload = {
	triggerId: string;
	viewId?: string;
	view?: { id?: string };
	appId?: string;
	[key: string]: unknown;
};

export const handlePayloadUserInteraction = (
	type: string,
	{ triggerId, ...data }: THandledServerPayload
): TModalAction | undefined => {
	const trigger = triggers.get(triggerId);
	if (!trigger || trigger.consumed) {
		return;
	}

	trigger.consumed = true;
	const modalType = toServerModalInteractionType(type);
	if (!modalType) {
		showToast(I18n.t('App_action_unsupported'));
		return;
	}
	const payloadAppId = data.appId ?? trigger.appId;
	if (!payloadAppId) {
		return;
	}

	const viewId = data.view?.id || data.viewId;
	if (!viewId) {
		return;
	}

	trigger.handled = modalType;

	if (modalType === ModalActions.ERRORS || modalType === ModalActions.UPDATE || modalType === ModalActions.CLOSE) {
		EventEmitter.emit(viewId, {
			...data,
			appId: payloadAppId,
			type: modalType,
			triggerId,
			viewId
		} as any);
		return modalType;
	}

	Navigation.navigate('ModalBlockView', {
		data: {
			...data,
			appId: payloadAppId,
			triggerId,
			viewId
		}
	});
	return ModalActions.OPEN;
};

type TTriggerResult = TModalAction | typeof ACKNOWLEDGED | undefined;

export function postUserInteraction(
	appId: string | undefined,
	buildInteraction: (triggerId: string) => UserInteraction
): Promise<TTriggerResult> {
	return withTriggerId(appId, async triggerId => {
		const interaction = buildInteraction(triggerId);

		const result = await appsApiFetch(`ui.interaction/${appId}/`, { method: 'POST', body: interaction });
		const text = await result.text();
		if (!text.trim()) {
			return triggers.get(triggerId)?.handled;
		}

		let parsed: { type?: string; [key: string]: unknown };
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error('Invalid JSON response from server');
		}

		const { type: interactionType, ...data } = parsed;
		if (!interactionType) {
			return triggers.get(triggerId)?.handled ?? ACKNOWLEDGED;
		}
		if (interactionType === ModalActions.CLOSE) {
			return ModalActions.CLOSE;
		}

		return handlePayloadUserInteraction(interactionType, data as THandledServerPayload) ?? triggers.get(triggerId)?.handled;
	});
}

export function triggerAction(action: ITriggerAction): Promise<TTriggerResult> {
	return postUserInteraction(action.appId, triggerId =>
		toUserInteraction({ ...action, payload: action.payload ?? action.value, triggerId })
	);
}
