import { delay } from "redux-saga";
import { select, put, call, take, takeLatest } from "redux-saga/effects";
import { StackActions } from "react-navigation";

import { CREATE_CHANNEL, LOGIN } from "../actions/actionsTypes";
import {
  createChannelSuccess,
  createChannelFailure
} from "../actions/createChannel";
import RocketChat from "../lib/rocketchat";
import { NavigationActions } from "../Navigation";

const create = function* create(data) {
  return yield RocketChat.createChannel(data);
};

const handleRequest = function* handleRequest({ data }) {
  try {
    const auth = yield select(state => state.login.isAuthenticated);
    if (!auth) {
      yield take(LOGIN.SUCCESS);
    }
    const result = yield call(create, data);
    yield put(createChannelSuccess(result));
    yield delay(300);
    const { rid, name } = result;

    const popAction = StackActions.pop({
      n: 2
    });
    yield call(NavigationActions.pop, popAction);

    yield delay(100);
    const dismissAction = StackActions.pop({
      n: 1
    });
    yield call(NavigationActions.pop, dismissAction);

    yield delay(300);

    const pushAction = StackActions.push({
      routeName: "RoomView",
      params: {
        title: name,
        rid: rid
      }
    });
    yield call(NavigationActions.push, pushAction);
  } catch (err) {
    yield put(createChannelFailure(err));
  }
};

const root = function* root() {
  yield takeLatest(CREATE_CHANNEL.REQUEST, handleRequest);
};

export default root;
