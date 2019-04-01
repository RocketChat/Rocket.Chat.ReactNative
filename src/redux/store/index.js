import { createStore, compose, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import { all, fork } from "redux-saga/effects";

// import { USER_LOGOUT } from './actions/authActions';
import createAppReducer from "../reducers";
import { adminSaga } from "../sagas";
import defaultI18nProvider from "../../main/ran-i18n/defaultI18nProvider";

export default ({
  customReducers = {},
  customSagas = [],
  authProvider,
  i18nProvider = defaultI18nProvider,
  dataProvider,
  dataRXProvider,
  initialState,
  locale = "en"
}) => {
  //reducers
  const messages = i18nProvider(locale);
  const appReducer = createAppReducer(customReducers, locale, messages);

  //sagas
  const saga = function* rootSaga() {
    yield all(
      [
        adminSaga(dataProvider, authProvider, dataRXProvider, i18nProvider),
        ...customSagas
      ].map(fork)
    );
  };

  //middlewares
  const sagaMiddleware = createSagaMiddleware();
  const middlewares = [sagaMiddleware];

  // store
  const store = createStore(
    appReducer,
    initialState,
    applyMiddleware(...middlewares)
  );

  sagaMiddleware.run(saga);

  return store;
};
