import { AsyncStorage } from "react-native";
import { call, put, takeLatest } from "redux-saga/effects";
import i18n from "i18n-js";

import * as actions from "../actions";
import { selectServerRequest } from "../actions/server";
import { changeLocale } from "../../main/ran-i18n/redux/actions/localeActions";
import { restoreToken, setUser } from "../actions/login";
import { setAllPreferences } from "../actions/sortPreferences";
import { APP } from "../actions/actionsTypes";
import RocketChat from "../lib/rocketchat";
import log from "../utils/log";

const restore = function* restore() {
  try {
    const token = yield call([AsyncStorage, "getItem"], RocketChat.TOKEN_KEY);
    if (token) {
      yield put(restoreToken(token));
    } else {
      const locale = yield call([AsyncStorage, "getItem"], "locale");
      if (locale) {
        i18n.locale = locale;
      }
      yield put(actions.appStart("outside"));
    }

    const currentServer = yield call(
      [AsyncStorage, "getItem"],
      "currentServer"
    );
    if (currentServer) {
      const user = yield call(
        [AsyncStorage, "getItem"],
        `${RocketChat.TOKEN_KEY}-${currentServer}`
      );
      if (user) {
        const userParsed = JSON.parse(user);
        if (userParsed.language) {
          yield put(changeLocale(userParsed.language));
          yield call([AsyncStorage, "setItem"], "locale", userParsed.language);
        }
        yield put(selectServerRequest(currentServer));
        yield put(setUser(userParsed));
      }
    }

    const sortPreferences = yield RocketChat.getSortPreferences();
    yield put(setAllPreferences(sortPreferences));

    yield put(actions.appReady({}));
  } catch (e) {
    log("restore", e);
  }
};

const root = function* root() {
  yield takeLatest(APP.INIT, restore);
};
export default root;
