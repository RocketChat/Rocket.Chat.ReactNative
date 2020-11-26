import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";

import Sidebar from "../views/SidebarView";

import ChatsStackNavigator from "./ChatStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";
import SettingsStackNavigator from "./SettingsStackNavigator";
import AdminPanelStackNavigator from "./AdminPanelStackNavigator";

const Drawer = createDrawerNavigator();
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={({ navigation, state }) => (
      <Sidebar navigation={navigation} state={state} />
    )}
    screenOptions={{ swipeEnabled: false }}
    drawerType="back"
  >
    <Drawer.Screen name="ChatsStackNavigator" component={ChatsStackNavigator} />
    <Drawer.Screen
      name="ProfileStackNavigator"
      component={ProfileStackNavigator}
    />
    <Drawer.Screen
      name="SettingsStackNavigator"
      component={SettingsStackNavigator}
    />
    <Drawer.Screen
      name="AdminPanelStackNavigator"
      component={AdminPanelStackNavigator}
    />
  </Drawer.Navigator>
);

export default DrawerNavigator;
