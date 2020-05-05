import I18n from '../i18n';

export const PASSCODE_KEY = 'kPasscode';
export const LOCKED_OUT_TIMER_KEY = 'kLockedOutTimer';
export const ATTEMPTS_KEY = 'kAttempts';

export const LOCAL_AUTHENTICATE_EMITTER = 'LOCAL_AUTHENTICATE';
export const CHANGE_PASSCODE_EMITTER = 'CHANGE_PASSCODE';

export const PASSCODE_LENGTH = 6;
export const MAX_ATTEMPTS = 6;
export const TIME_TO_LOCK = 30000;

export const DEFAULT_AUTO_LOCK = 1800;

export const DEFAULT_AUTO_LOCK_OPTIONS = [
	{
		title: I18n.t('Local_authentication_auto_lock_60'),
		value: 60
	},
	{
		title: I18n.t('Local_authentication_auto_lock_300'),
		value: 300
	},
	{
		title: I18n.t('Local_authentication_auto_lock_900'),
		value: 900
	},
	{
		title: I18n.t('Local_authentication_auto_lock_1800'),
		value: 1800
	},
	{
		title: I18n.t('Local_authentication_auto_lock_3600'),
		value: 3600
	}
];
