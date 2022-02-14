import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';

import { IApplicationState } from '../definitions';

const getUser = (state: IApplicationState) => {
	if (!isEmpty(state.share?.user)) {
		return state.share.user;
	}
	return state.login?.user;
};
const getLoginServices = (state: IApplicationState) => state.login.services || {};
const getShowFormLoginSetting = (state: IApplicationState) => state.settings.Accounts_ShowFormLogin || false;
const getIframeEnabledSetting = (state: IApplicationState) => state.settings.Accounts_iframe_enabled || false;

export const getUserSelector = createSelector([getUser], user => user);

export const getShowLoginButton = createSelector(
	[getLoginServices, getShowFormLoginSetting, getIframeEnabledSetting],
	(loginServices, showFormLogin, iframeEnabled) => showFormLogin || Object.values(loginServices).length || iframeEnabled
);
