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

const triggersId = new Map<string, string | undefined>();
const handledTriggers = new Map<string, TModalAction>();

const invalidateTriggerId = (id: string) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const withTriggerId = async <T>(appId: string | undefined, request: (triggerId: string) => Promise<T>): Promise<T> => {
	const triggerId = random(17);
	triggersId.set(triggerId, appId);
	try {
		return await request(triggerId);
	} finally {
		setTimeout(() => {
			triggersId.delete(triggerId);
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
	if (!triggersId.has(triggerId)) {
		return;
	}

	const triggerAppId = invalidateTriggerId(triggerId);
	const modalType = toServerModalInteractionType(type);
	if (!modalType) {
		showToast(I18n.t('App_action_unsupported'));
		return;
	}
	handledTriggers.set(triggerId, modalType);
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

export function triggerAction({
	type,
	actionId,
	appId,
	rid,
	mid,
	tmid,
	viewId,
	container,
	...rest
}: ITriggerAction): Promise<TModalAction | typeof ACKNOWLEDGED | undefined> {
	const payload = rest.payload ?? rest.value;

	return withTriggerId(appId, async triggerId => {
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
		const modalType = toServerModalInteractionType(interactionType ?? '');
		if (!modalType) {
			if (interactionType) {
				showToast(I18n.t('App_action_unsupported'));
				return;
			}
			return handledTriggers.get(triggerId) ?? ACKNOWLEDGED;
		}
		if (modalType === ModalActions.CLOSE) {
			return ModalActions.CLOSE;
		}

		return handlePayloadUserInteraction(modalType, data as THandledServerPayload) ?? handledTriggers.get(triggerId);
	});
}
