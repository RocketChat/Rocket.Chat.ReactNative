import { type Action } from 'redux';

import { SET_APPS_LANGUAGES } from './actionsTypes';
import { type IAppsLanguages } from '../definitions';

export interface ISetAppsLanguages extends Action {
	languages: IAppsLanguages;
}

export type TActionApps = ISetAppsLanguages;

export function setAppsLanguages(languages: IAppsLanguages): ISetAppsLanguages {
	return {
		type: SET_APPS_LANGUAGES,
		languages
	};
}
