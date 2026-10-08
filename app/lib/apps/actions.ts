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

const appIdByTriggerId = new Map<string, string | undefined>();
const handledTriggers = new Map<string, TModalAction>();

const invalidateTriggerId = (id: string) => {
	const appId = appIdByTriggerId.get(id);
	appIdByTriggerId.delete(id);
	return appId;
};

export const withTriggerId = async <T>(appId: string | undefined, request: (triggerId: string) => Promise<T>): Promise<T> => {
	const triggerId = random(17);
	appIdByTriggerId.set(triggerId, appId);
	try {
		return await request(triggerId);
	} finally {
		setTimeout(() => {
			appIdByTriggerId.delete(triggerId);
			handledTriggers.delete(triggerId);
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
	if (!appIdByTriggerId.has(triggerId)) {
		return;
	}

	const triggerAppId = invalidateTriggerId(triggerId);
	const modalType = toServerModalInteractionType(type);
	if (!modalType) {
		showToast(I18n.t('App_action_unsupported'));
		return;
	}
	const payloadAppId = data.appId ?? triggerAppId;
	if (!payloadAppId) {
		return;
	}

	const viewId = data.view?.id || data.viewId;
	if (!viewId) {
		return;
	}

	handledTriggers.set(triggerId, modalType);

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

export function triggerAction(action: ITriggerAction): Promise<TModalAction | typeof ACKNOWLEDGED | undefined> {
	const { appId } = action;

	return withTriggerId(appId, async triggerId => {
		const interaction = toUserInteraction({ ...action, payload: action.payload ?? action.value, triggerId });

		const result = await appsApiFetch(`ui.interaction/${appId}/`, { method: 'POST', body: interaction });
		const text = await result.text();
		if (!text.trim()) {
			return handledTriggers.get(triggerId);
		}

		let parsed: { type?: string; [key: string]: unknown };
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error('Invalid JSON response from server');
		}

		const { type: interactionType, ...data } = parsed;
		if (!interactionType) {
			return handledTriggers.get(triggerId) ?? ACKNOWLEDGED;
		}
		if (interactionType === ModalActions.CLOSE) {
			return ModalActions.CLOSE;
		}

		return handlePayloadUserInteraction(interactionType, data as THandledServerPayload) ?? handledTriggers.get(triggerId);
	});
}
