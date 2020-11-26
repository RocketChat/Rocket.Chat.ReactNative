import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import AdminPanelView from "../views/AdminPanelView";

const AdminPanelStack = createStackNavigator();
const AdminPanelStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <AdminPanelStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <AdminPanelStack.Screen
        name="AdminPanelView"
        component={AdminPanelView}
        options={AdminPanelView.navigationOptions}
      />
    </AdminPanelStack.Navigator>
  );
};

export default AdminPanelStackNavigator;
