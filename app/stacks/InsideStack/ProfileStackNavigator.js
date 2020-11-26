import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import ProfileView from "../views/ProfileView";
import UserPreferencesView from "../views/UserPreferencesView";
import UserNotificationPrefView from "../views/UserNotificationPreferencesView";
import PickerView from "../views/PickerView";

const ProfileStack = createStackNavigator();
const ProfileStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);
  return (
    <ProfileStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <ProfileStack.Screen
        name="ProfileView"
        component={ProfileView}
        options={ProfileView.navigationOptions}
      />
      <ProfileStack.Screen
        name="UserPreferencesView"
        component={UserPreferencesView}
        options={UserPreferencesView.navigationOptions}
      />
      <ProfileStack.Screen
        name="UserNotificationPrefView"
        component={UserNotificationPrefView}
        options={UserNotificationPrefView.navigationOptions}
      />
      <ProfileStack.Screen
        name="PickerView"
        component={PickerView}
        options={PickerView.navigationOptions}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
