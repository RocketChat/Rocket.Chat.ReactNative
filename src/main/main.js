import React from "react";

import { CoreMain, Screen } from "./ran-core";

class AppDesk extends React.Component {
  render() {
    return <CoreMain {...this.props} />;
  }

  // componentWillMount() {
  //   i18n
  //     .init()
  //     .then(() => {
  //       const RNDir = RNI18nManager.isRTL ? "RTL" : "LTR";

  //       // RN doesn't always correctly identify native
  //       // locale direction, so we force it here.
  //       if (i18n.dir !== RNDir) {
  //         const isLocaleRTL = i18n.dir === "RTL";

  //         RNI18nManager.forceRTL(isLocaleRTL);

  //         // RN won't set the layout direction if we
  //         // don't restart the app's JavaScript.
  //         Expo.Updates.reloadFromCache();
  //       }

  //       this.setState({ isI18nInitialized: true });
  //     })
  //     .catch(error => console.warn(error));
  // }
}

export { AppDesk, Screen };
