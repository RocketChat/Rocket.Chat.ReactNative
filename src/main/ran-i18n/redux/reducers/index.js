import { combineReducers } from "redux";
import localeReducer from "./localeReducer";
import messagesReducer from "./messagesReducer";
import loading from "./loadingReducer";

export default (initialLocale, defaultMessages) =>
  combineReducers({
    locale: localeReducer(initialLocale),
    messages: messagesReducer(defaultMessages),
    loading
  });

export const getLocale = state => state.locale;
