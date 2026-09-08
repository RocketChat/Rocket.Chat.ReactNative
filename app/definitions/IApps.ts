import { type TAppLanguageDictionaries } from '../lib/methods/helpers/getAppTranslation';

export interface IAppsLanguages {
	[appId: string]: TAppLanguageDictionaries;
}

export interface IAppsState {
	languages: IAppsLanguages;
}
