import { createSelector } from 'reselect';
import { isEmpty } from 'lodash';

const getUser = (state) => {
	if (!isEmpty(state.share?.user)) {
		return state.share.user;
	}
	return state.login?.user;
};
const getLoginServices = state => state.login.services || {};
const getShowFormLoginSetting = state => state.settings.Accounts_ShowFormLogin || false;

export const getUserSelector = createSelector(
	[getUser],
	user => user
);

export const getShowLoginButton = createSelector(
	[getLoginServices, getShowFormLoginSetting],
	(loginServices, showFormLogin) => showFormLogin || Object.values(loginServices).length
);
