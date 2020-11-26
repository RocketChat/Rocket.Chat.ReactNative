import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import SettingsView from "../views/SettingsView";
import SecurityPrivacyView from "../views/SecurityPrivacyView";
import E2EEncryptionSecurityView from "../views/E2EEncryptionSecurityView";
import LanguageView from "../views/LanguageView";
import ThemeView from "../views/ThemeView";
import DefaultBrowserView from "../views/DefaultBrowserView";
import ScreenLockConfigView from "../views/ScreenLockConfigView";

const SettingsStack = createStackNavigator();
const SettingsStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <SettingsStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <SettingsStack.Screen
        name="SettingsView"
        component={SettingsView}
        options={SettingsView.navigationOptions}
      />
      <SettingsStack.Screen
        name="SecurityPrivacyView"
        component={SecurityPrivacyView}
        options={SecurityPrivacyView.navigationOptions}
      />
      <SettingsStack.Screen
        name="E2EEncryptionSecurityView"
        component={E2EEncryptionSecurityView}
        options={E2EEncryptionSecurityView.navigationOptions}
      />
      <SettingsStack.Screen
        name="LanguageView"
        component={LanguageView}
        options={LanguageView.navigationOptions}
      />
      <SettingsStack.Screen
        name="ThemeView"
        component={ThemeView}
        options={ThemeView.navigationOptions}
      />
      <SettingsStack.Screen
        name="DefaultBrowserView"
        component={DefaultBrowserView}
        options={DefaultBrowserView.navigationOptions}
      />
      <SettingsStack.Screen
        name="ScreenLockConfigView"
        component={ScreenLockConfigView}
        options={ScreenLockConfigView.navigationOptions}
      />
    </SettingsStack.Navigator>
  );
};

export default SettingsStackNavigator;
