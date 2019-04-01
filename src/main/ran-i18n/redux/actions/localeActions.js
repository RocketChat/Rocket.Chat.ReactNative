export const CHANGE_LOCALE = "RAN/CHANGE_LOCALE";
export const CHANGE_LOCALE_SUCCESS = "RAN/CHANGE_LOCALE_SUCCESS";
export const CHANGE_LOCALE_FAILURE = "RAN/CHANGE_LOCALE_FAILURE";

export const changeLocale = locale => ({
  type: CHANGE_LOCALE,
  payload: locale
});

export const changeLocaleSuccess = (locale, messages) => ({
  type: CHANGE_LOCALE_SUCCESS,
  payload: {
    locale,
    messages
  }
});

export const changeLocaleFailure = (locale, error) => ({
  type: CHANGE_LOCALE_FAILURE,
  error,
  payload: {
    locale
  }
});
