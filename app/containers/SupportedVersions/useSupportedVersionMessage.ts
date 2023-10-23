import moment from 'moment';

import { useAppSelector } from '../../lib/hooks';

const applyParams = (message: string, params: Record<string, unknown>) => {
	const keys = Object.keys(params);
	const regex = new RegExp(`{{(${keys.join('|')})}}`, 'g');
	return message.replace(regex, (_, p1) => params[p1] as string);
};

const useUser = () => {
	const { username, name, emails, language } = useAppSelector(state => state.login.user);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const user = useRealName ? name : username;
	return { user, email: emails?.[0]?.address, language };
};

export const useSupportedVersionMessage = () => {
	const { message, i18n, expiration } = useAppSelector(state => state.supportedVersions);
	const { name, server, version } = useAppSelector(state => state.server);
	const { language = 'en', user, email } = useUser();

	const params = {
		instance_username: user,
		instance_email: email,
		instance_ws_name: name,
		instance_domain: server,
		remaining_days: moment(expiration).diff(new Date(), 'days'),
		instance_version: version,
		...message?.params
	};

	if (!message || !i18n) {
		return null;
	}

	const i18nLang = i18n[language] ?? i18n.en;

	const getTranslation = (key: string | undefined) => (key && i18nLang[key] ? applyParams(i18nLang[key], params) : undefined);

	return {
		title: getTranslation(message.title),
		subtitle: getTranslation(message.subtitle),
		description: getTranslation(message.description),
		link: message.link
	};
};
