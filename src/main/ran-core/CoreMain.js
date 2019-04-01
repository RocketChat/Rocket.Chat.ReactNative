import React from "react";
import PropTypes from "prop-types";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "i18n-js";

import CoreMainNavigator from "./CoreMainNavigator";
// import LoginView from "../../defaultLoginModule/LoginView";
// import { store } from "../../src";
// import { appInit } from "../../chatModule/actions";
// import { selectServerRequest } from "../../chatModule/redux/actions/server";
// import { iconsLoaded } from "../../chatModule/Icons";
// import { registerScreens } from "../../chatModule/views";
import { ChatModuleNavigator } from "../../chatModule";

// registerScreens(store);
// iconsLoaded();

class CoreMain extends React.Component {
  // constructor(props) {
  //   super(props);

  //   store.dispatch(selectServerRequest({ server: "http://localhost:3000" }));
  //   store.dispatch(appInit());
  //   store.subscribe(this.onStoreUpdate).bind(this);
  // }

  // onStoreUpdate = () => {
  //   console.log(store.getState());

  //   const { root } = store.getState().app;

  //   if (this.currentRoot !== root) {
  //     this.currentRoot = root;
  //     if (root === "outside") {
  //       console.log("startNotLogged();");
  //     } else if (root === "inside") {
  //       console.log("startLogged();");
  //     }
  //   }
  // };

  render() {
    const Nav = CoreMainNavigator({
      Chat: {
        screen: ChatModuleNavigator,
        navigationOptions: {
          tabBarLabel: i18n.t("ran.chat.chat"),
          tabBarIcon: ({ tintColor }) => (
            <Ionicons
              name={"ios-text"}
              size={26}
              style={{ color: tintColor }}
            />
          )
        }
      },
      ...this.props.modules
    });

    // const AuthNav = createSwitchNavigator(
    //   {
    //     // AuthLoading: AuthLoadingScreen,
    //     App: Nav,
    //     Base: ChatModuleNavigator //() => <ChatModule /> //this.props.loginPage ? this.props.loginPage : () => <LoginView />
    //   },
    //   {
    //     initialRouteName: "App"
    //   }
    // );

    return <Nav />;
  }
}

CoreMain.propTypes = {
  modules: PropTypes.object.isRequired
};

export default CoreMain;
