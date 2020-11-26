import { takeLatest, select } from "redux-saga/effects";

import RocketChat from "../lib/rocketchat";
import { setBadgeCount } from "../notifications/push";
import log from "../utils/log";
import {
  localAuthenticate,
  saveLastLocalAuthenticationSession,
} from "../utils/localAuthentication";
import { APP_STATE } from "../actions/actionsTypes";
import { ROOT_OUTSIDE } from "../actions/app";
import { func } from "prop-types";

const appHasComeBackTo = function* appHasComeBackTo(local) {
  const appRoot = yield select((state) => state.app.root);
  if (appRoot === ROOT_OUTSIDE) {
    return;
  }

  const auth = yield select((state) => state.login.isAuthenticated);
  if (!auth) {
    return;
  }

  if (local == "background") {
    const localAuthenticated = yield select(
      (state) => state.login.isLocalAuthenticated
    );
    if (!localAuthenticated) {
      return;
    }
  }

  try {
    const server = yield select((state) => state.server.server);

    if (local == "foreground") {
      yield localAuthenticate(server);
      setBadgeCount();
      return yield RocketChat.setUserPresenceOnline();
    } else if (local == "background") {
      yield saveLastLocalAuthenticationSession(server);

      yield RocketChat.setUserPresenceAway();
    }
  } catch (e) {
    log(e);
  }
};

const root = function* root() {
  yield takeLatest(APP_STATE.FOREGROUND, () => appHasComeBackTo("foreground"));
  yield takeLatest(APP_STATE.BACKGROUND, () => appHasComeBackTo("background"));
};

export default root;
