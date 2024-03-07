import i18n from '../../i18n';

// https://github.com/RocketChat/Rocket.Chat/blob/cd5cbe2ac60939d4d94a62926b43322be9168ce0/packages/web-ui-registration/src/LoginForm.tsx#L28
const LOGIN_SUBMIT_ERRORS = {
	'error-user-is-not-activated': {
		i18n: 'Before_you_can_login'
	},
	'error-app-user-is-not-allowed-to-login': {
		i18n: 'App_users_are_not_allowed_to_log_in_directly'
	},
	'user-not-found': {
		i18n: 'User_not_found_or'
	},
	'error-login-blocked-for-ip': {
		i18n: 'Login_has_been_temporarily_blocked_for_this_IP'
	},
	'error-login-blocked-for-user': {
		i18n: 'Login_has_been_temporarily_blocked_for_this_User'
	},
	'error-license-user-limit-reached': {
		i18n: 'The_maximum_number_of_users_has_been_reached'
	},
	'error-invalid-email': {
		i18n: 'Invalid_Email'
	}
};

export const handleLoginErrors = (error: keyof typeof LOGIN_SUBMIT_ERRORS): string => {
	if (typeof error === 'string') {
		const errorKey = Object.keys(LOGIN_SUBMIT_ERRORS).find(key => error?.includes(key)) as keyof typeof LOGIN_SUBMIT_ERRORS;
		const e = errorKey ? LOGIN_SUBMIT_ERRORS[errorKey]?.i18n : 'Login_error';
		if (i18n.isTranslated(e)) {
			return i18n.t(e);
		}
	}
	return i18n.t('Login_error');
};
