import { delay } from "redux-saga";
import { takeLatest, put, call } from "redux-saga/effects";
import { StackActions } from "react-navigation";

import { MESSAGES } from "../actions/actionsTypes";
import {
  messagesSuccess,
  messagesFailure,
  deleteSuccess,
  deleteFailure,
  editSuccess,
  editFailure,
  toggleStarSuccess,
  toggleStarFailure,
  togglePinSuccess,
  togglePinFailure,
  replyInit
} from "../actions/messages";
import RocketChat from "../lib/rocketchat";
import database from "../../main/ran-db/sqlite";
import log from "../utils/log";
import { NavigationActions } from "../Navigation";

const deleteMessage = message => RocketChat.deleteMessage(message);
const editMessage = message => RocketChat.editMessage(message);
const toggleStarMessage = message => RocketChat.toggleStarMessage(message);
const togglePinMessage = message => RocketChat.togglePinMessage(message);

const get = function* get({ room }) {
  try {
    if (room.lastOpen) {
      yield RocketChat.loadMissedMessages(room);
    } else {
      yield RocketChat.loadMessagesForRoom(room);
    }
    yield put(messagesSuccess());
  } catch (err) {
    console.warn("messagesFailure", err);
    yield put(messagesFailure(err.status));
  }
};

const handleDeleteRequest = function* handleDeleteRequest({ message }) {
  try {
    yield call(deleteMessage, message);
    yield put(deleteSuccess());
  } catch (error) {
    yield put(deleteFailure());
  }
};

const handleEditRequest = function* handleEditRequest({ message }) {
  try {
    yield call(editMessage, message);
    yield put(editSuccess());
  } catch (error) {
    yield put(editFailure());
  }
};

const handleToggleStarRequest = function* handleToggleStarRequest({ message }) {
  try {
    yield call(toggleStarMessage, message);
    yield put(toggleStarSuccess());
  } catch (error) {
    yield put(toggleStarFailure());
  }
};

const handleTogglePinRequest = function* handleTogglePinRequest({ message }) {
  try {
    if (message.u) {
      message.u = JSON.parse(message.u);
    }
    yield call(togglePinMessage, message);
    yield put(togglePinSuccess());
  } catch (error) {
    yield put(togglePinFailure(error));
  }
};

const goRoom = function* goRoom({ rid, name }) {
  const popAction = StackActions.pop({
    n: 1
  });
  yield call(NavigationActions.pop, popAction);

  yield delay(600);
  console.log("biubiu:  NavigationActions.push({");
  const pushAction = StackActions.push({
    routeName: "RoomView",
    params: {
      title: name,
      rid: rid
    }
  });
  yield call(NavigationActions.push, pushAction);
};

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
  try {
    const { username } = JSON.parse(message.u);
    const subscriptions = yield database.objects(
      "subscriptions",
      `WHERE name = "${username}"`
    );
    if (subscriptions.length) {
      yield goRoom({ rid: subscriptions[0].rid, name: subscriptions[0].name });
    } else {
      const room = yield RocketChat.createDirectMessage(username);
      yield goRoom({ rid: room.rid, name: username });
    }
    yield delay(500);
    yield put(replyInit(message, false));
  } catch (e) {
    log("handleReplyBroadcast", e);
  }
};

const root = function* root() {
  yield takeLatest(MESSAGES.REQUEST, get);
  yield takeLatest(MESSAGES.DELETE_REQUEST, handleDeleteRequest);
  yield takeLatest(MESSAGES.EDIT_REQUEST, handleEditRequest);
  yield takeLatest(MESSAGES.TOGGLE_STAR_REQUEST, handleToggleStarRequest);
  yield takeLatest(MESSAGES.TOGGLE_PIN_REQUEST, handleTogglePinRequest);
  yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;
