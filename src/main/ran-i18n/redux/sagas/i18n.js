import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  CHANGE_LOCALE,
  changeLocaleSuccess,
  changeLocaleFailure
} from "../actions/localeActions";

const loadMessages = function*(i18nProvider, action) {
  const locale = action.payload;

  try {
    const messages = yield call(i18nProvider, locale);
    yield put(changeLocaleSuccess(locale, messages));
  } catch (err) {
    yield put(changeLocaleFailure(action.payload.locale, err));
  }
};

const root = function* root(i18nProvider) {
  yield takeLatest(CHANGE_LOCALE, loadMessages, i18nProvider);
};
export default root;
