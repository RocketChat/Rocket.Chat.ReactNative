import type { UserInteraction } from '@rocket.chat/ui-kit';

import {
	ActionTypes,
	type IEmitUserInteraction,
	type ITriggerAction,
	type ITriggerBlockAction,
	type ITriggerCancel,
	type ITriggerSubmitView,
	ModalActions,
	type TModalAction
} from '~/containers/UIKit/interfaces';
import { toServerModalInteractionType, toUserInteraction } from '~/containers/UIKit/interactionAdapters';
import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { showToast } from '~/lib/methods/helpers/showToast';
import log from '~/lib/methods/helpers/log';
import { random } from '~/lib/methods/helpers';
import Navigation from '~/lib/navigation/appNavigation';
import { appsApiFetch } from '~/lib/services/appsApiFetch';
import { type IAppActionButton, UIActionButtonContext } from './definitions';

const TRIGGER_TIMEOUT = 5000;

const ACKNOWLEDGED = 'acknowledged';

const KEEPS_VIEW_OPEN: ReadonlySet<string> = new Set([ModalActions.ERRORS, ModalActions.UPDATE, 'contextual_bar.update']);

const triggers = new Map<string, { appId?: string; consumed?: boolean; handled?: TModalAction }>();

export const clearTriggers = () => triggers.clear();

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

export const handlePayloadUserInteraction = (type: string, { triggerId, ...data }: THandledServerPayload): void => {
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
	const viewId = data.view?.id || data.viewId;
	const appId = data.appId ?? trigger.appId;
	if (modalType !== ModalActions.CLOSE && (!viewId || !appId)) {
		return;
	}

	trigger.handled = modalType;
	if (!viewId) {
		return;
	}

	if (modalType === ModalActions.OPEN) {
		Navigation.navigate('ModalBlockView', { data: { ...data, appId, triggerId, viewId } });
		return;
	}

	EventEmitter.emit(viewId, { ...data, appId, type: modalType, triggerId, viewId } as IEmitUserInteraction);
};

type TTriggerResult = TModalAction | typeof ACKNOWLEDGED | undefined;

function postUserInteraction(
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
		if (interactionType === ModalActions.CLOSE) {
			triggers.delete(triggerId);
			return ModalActions.CLOSE;
		}

		if (interactionType) {
			handlePayloadUserInteraction(interactionType, data as THandledServerPayload);
		}
		const handled = triggers.get(triggerId)?.handled;
		return handled ?? (interactionType && KEEPS_VIEW_OPEN.has(interactionType) ? undefined : ACKNOWLEDGED);
	});
}

function triggerAction(action: ITriggerAction): Promise<TTriggerResult> {
	return postUserInteraction(action.appId, triggerId =>
		toUserInteraction({ ...action, payload: action.payload ?? action.value, triggerId })
	);
}

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView): Promise<boolean> {
	const result = await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options });
	return result === ModalActions.CLOSE || result === ACKNOWLEDGED;
}

export async function triggerCancel({ view, ...options }: ITriggerCancel): Promise<void> {
	await triggerAction({ type: ActionTypes.CLOSED, view, ...options });
}

export async function triggerBlockAction(options: ITriggerBlockAction): Promise<boolean> {
	const result = await triggerAction({ type: ActionTypes.ACTION, ...options });
	return result === ModalActions.CLOSE;
}

interface ITriggerAppActionButton {
	button: IAppActionButton;
	rid?: string;
	tmid?: string;
	message?: string;
}

export async function triggerAppActionButton({ button, rid, tmid, message }: ITriggerAppActionButton) {
	try {
		const { actionId, appId, context } = button;
		await postUserInteraction(appId, (triggerId): UserInteraction => {
			if (context === UIActionButtonContext.USER_DROPDOWN_ACTION) {
				return { type: 'actionButton', actionId, triggerId, payload: { context } };
			}
			if (!rid) {
				throw new Error(`rid is required for ${context} action buttons`);
			}
			if (context === UIActionButtonContext.ROOM_ACTION) {
				return { type: 'actionButton', actionId, rid, triggerId, payload: { context } };
			}
			return { type: 'actionButton', actionId, rid, tmid, triggerId, payload: { context, message: message ?? '' } };
		});
	} catch (e) {
		log(e);
		showToast(I18n.t('App_action_error'));
	}
}
