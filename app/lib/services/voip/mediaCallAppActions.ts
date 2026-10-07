import I18n from '~/i18n';
import fetch from '~/lib/methods/helpers/fetch';
import { generateTriggerId } from '~/lib/methods/actions';
import sdk from '~/lib/services/sdk';

export type MediaCallWidgetState = 'calling' | 'ringing' | 'ongoing';

export type MediaCallAppAction = {
	appId: string;
	actionId: string;
	label: string;
	variant?: 'default' | 'danger';
	disabled?: boolean;
	callStates?: MediaCallWidgetState[];
};

export type MediaCallAppActionUpdate = Partial<Pick<MediaCallAppAction, 'actionId' | 'label' | 'variant' | 'disabled'>>;

type TActionButton = {
	appId: string;
	actionId: string;
	context: string;
	labelI18n: string;
	variant?: 'danger';
	when?: { callStates?: MediaCallWidgetState[] };
};

type TAppLanguages = { id: string; languages: Record<string, Record<string, string>> };

const getAuth = () => {
	const { host, currentLogin } = sdk;
	if (!host || !currentLogin) {
		throw new Error('Media call app actions require an initialized, authenticated session');
	}
	return {
		host,
		headers: { 'X-Auth-Token': currentLogin.authToken, 'X-User-Id': currentLogin.userId }
	};
};

const translateAppLabel = (key: string, appId: string, apps: TAppLanguages[]): string => {
	const languages = apps.find(app => app.id === appId)?.languages;
	if (!languages) {
		return key;
	}
	const locale = I18n.locale ?? 'en';
	const [baseLocale] = locale.split('-');
	return languages[locale]?.[key] ?? languages[baseLocale]?.[key] ?? languages.en?.[key] ?? key;
};

let appLanguages: Promise<TAppLanguages[]> | null = null;

const getAppLanguages = (): Promise<TAppLanguages[]> => {
	if (!appLanguages) {
		const { host, headers } = getAuth();
		appLanguages = fetch(`${host}/api/apps/languages`, { headers })
			.then(res => (res.ok ? res.json() : { apps: [] }))
			.then(({ apps }) => apps ?? [])
			.catch(() => {
				appLanguages = null;
				return [];
			});
	}
	return appLanguages;
};

export const fetchMediaCallAppActions = async (): Promise<MediaCallAppAction[]> => {
	const { host, headers } = getAuth();
	// apps endpoints live outside /api/v1
	const res = await fetch(`${host}/api/apps/actionButtons`, { headers });
	if (!res.ok) {
		return [];
	}
	const buttons: TActionButton[] = await res.json();
	const mediaCallButtons = buttons.filter(button => button.context === 'mediaCallWidgetAction');
	if (!mediaCallButtons.length) {
		return [];
	}
	const apps = await getAppLanguages();
	return mediaCallButtons.map(button => ({
		appId: button.appId,
		actionId: button.actionId,
		label: translateAppLabel(button.labelI18n, button.appId, apps),
		variant: button.variant,
		...(button.when?.callStates ? { callStates: button.when.callStates } : {})
	}));
};

export const triggerMediaCallAppAction = async ({
	appId,
	actionId,
	callId,
	rid
}: {
	appId: string;
	actionId: string;
	callId: string;
	rid?: string;
}): Promise<MediaCallAppActionUpdate | undefined> => {
	const { host, headers } = getAuth();
	const triggerId = generateTriggerId(appId);
	const res = await fetch(`${host}/api/apps/ui.interaction/${appId}/`, {
		method: 'POST',
		headers: { ...headers, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			type: 'actionButton',
			actionId,
			triggerId,
			...(rid ? { rid } : {}),
			payload: { context: 'mediaCallWidgetAction', callId }
		})
	});
	if (!res.ok) {
		throw new Error(`Failed to trigger media call app action: ${res.status}`);
	}
	const text = await res.text();
	if (!text.trim()) {
		return;
	}
	const response = JSON.parse(text);
	if (response?.type !== 'action_button.update' || !response.update) {
		return;
	}
	const { update } = response;
	const apps = update.labelI18n ? await getAppLanguages() : [];
	return {
		...(update.labelI18n && { label: translateAppLabel(update.labelI18n, appId, apps) }),
		...(update.variant && { variant: update.variant }),
		...(update.disabled !== undefined && { disabled: update.disabled }),
		...(update.actionId && { actionId: update.actionId })
	};
};
