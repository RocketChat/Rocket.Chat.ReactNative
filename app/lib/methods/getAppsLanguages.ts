import { store as reduxStore } from '../store/auxStore';
import log from './helpers/log';
import { normalizeAppLanguage, type TAppLanguageDictionaries } from './helpers/getAppTranslation';
import { setAppsLanguages } from '../../actions/apps';
import { type IAppLanguages } from '../../definitions/rest/v1/apps';
import { type IAppsLanguages } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import fetch from './helpers/fetch';

export const normalizeAppsLanguages = (apps: IAppLanguages[] | undefined): IAppsLanguages => {
	const result: IAppsLanguages = {};
	apps?.forEach(({ id, languages }) => {
		if (!id || !languages) {
			return;
		}
		result[id] = Object.entries(languages).reduce<TAppLanguageDictionaries>((acc, [language, dictionary]) => {
			acc[normalizeAppLanguage(language)] = dictionary;
			return acc;
		}, {});
	});
	return result;
};

// The endpoint lives under the Apps-Engine prefix (/api/apps/languages), outside
// the /api/v1 base the sdk REST client targets, so it is fetched like /api/info.
export async function getAppsLanguages(): Promise<void> {
	try {
		const { server } = reduxStore.getState().server;
		const user = getUserSelector(reduxStore.getState());

		const response = await fetch(`${server}/api/apps/languages`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': user?.token,
				'X-User-Id': user?.id
			}
		});

		const result: { apps?: IAppLanguages[]; success: boolean } = await response.json();
		if (!result.success) return;
		reduxStore.dispatch(setAppsLanguages(normalizeAppsLanguages(result.apps)));
	} catch (e) {
		// Servers without the Apps engine (or older than the endpoint) 404 here.
		// Every consumer falls back to the block's literal text, so this is not fatal.
		log(e);
	}
}
