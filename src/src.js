import React from "react";
import { Dimensions } from "react-native";
import { Provider } from "react-redux";
import EStyleSheet from "react-native-extended-stylesheet";

import defaultTheme from "./base/styles/defaultTheme";
import { AppDesk } from "./main/main";
import createAppStore from "./redux/store";

const { width } = Dimensions.get("window");
EStyleSheet.build({
  ...defaultTheme,
  $rem: width > 340 ? 18 : 16
});

/**
 * RNChatApp props:
 * modules--stackNavigation views object
 * loginPage--loginPage having default one
 * authProvider--expect a function returning a Promise, to control the application authentication strategy
 * dataProvider--saga fetch http datasource
 * dataRXProvider--reactive datasource such as using ddp
 * locale--i18n: en zh
 * i18nProvider--
 */

export var store;

export default class RNChatApp extends React.Component {
  render() {
    store = createAppStore({
      ...this.props
    });

    return (
      <Provider store={store}>
        <AppDesk {...this.props} />
      </Provider>
    );
  }
}
