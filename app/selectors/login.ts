import { createSelector } from 'reselect';

import { IApplicationState, IUser } from '../definitions';

export interface IServices {
	facebook: { clientId: string };
	github: { clientId: string };
	gitlab: { clientId: string };
	google: { clientId: string };
	linkedin: { clientId: string };
	'meteor-developer': { clientId: string };
	wordpress: { clientId: string; serverURL: string };
}

const getUser = (state: IApplicationState): IUser => state.login?.user as IUser;
const getLoginServices = (state: IApplicationState) => (state.login.services as IServices) || {};
const getShowFormLoginSetting = (state: IApplicationState) => (state.settings.Accounts_ShowFormLogin as boolean) || false;
const getIframeEnabledSetting = (state: IApplicationState) => (state.settings.Accounts_iframe_enabled as boolean) || false;

export const getUserSelector = createSelector([getUser], user => user);

export const getShowLoginButton = createSelector(
	[getLoginServices, getShowFormLoginSetting, getIframeEnabledSetting],
	(loginServices, showFormLogin, iframeEnabled) =>
		(showFormLogin || Object.values(loginServices).length || iframeEnabled) as boolean
);
