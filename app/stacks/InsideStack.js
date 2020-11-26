import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { ThemeContext } from "../theme";
import {
  defaultHeader,
  themedHeader,
  ModalAnimation,
  StackAnimation,
} from "../utils/navigation";
import Sidebar from "../views/SidebarView";

import ChatsStackNavigator from "./InsideStack/ChatStackNavigator";
import ProfileStackNavigator from "./InsideStack/ProfileStackNavigator";
import SettingsStackNavigator from "./InsideStack/SettingsStackNavigator";
import AdminPanelStackNavigator from "./InsideStack/AdminPanelStackNavigator";

import SelectedUsersView from "../views/SelectedUsersView";

// Settings Stack

// Admin Stack

// NewMessage Stack
import NewMessageView from "../views/NewMessageView";
import CreateChannelView from "../views/CreateChannelView";

// E2ESaveYourPassword Stack
import E2ESaveYourPasswordView from "../views/E2ESaveYourPasswordView";
import E2EHowItWorksView from "../views/E2EHowItWorksView";

// E2EEnterYourPassword Stack
import E2EEnterYourPasswordView from "../views/E2EEnterYourPasswordView";

// InsideStackNavigator
import AttachmentView from "../views/AttachmentView";
import ModalBlockView from "../views/ModalBlockView";
import JitsiMeetView from "../views/JitsiMeetView";
import StatusView from "../views/StatusView";
import ShareView from "../views/ShareView";
import CreateDiscussionView from "../views/CreateDiscussionView";

// ChatsStackNavigator

// ProfileStackNavigator

// SettingsStackNavigator

// AdminPanelStackNavigator

// DrawerNavigator
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

// NewMessageStackNavigator
const NewMessageStack = createStackNavigator();
const NewMessageStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <NewMessageStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <NewMessageStack.Screen
        name="NewMessageView"
        component={NewMessageView}
        options={NewMessageView.navigationOptions}
      />
      <NewMessageStack.Screen
        name="SelectedUsersViewCreateChannel"
        component={SelectedUsersView}
      />
      <NewMessageStack.Screen
        name="CreateChannelView"
        component={CreateChannelView}
        options={CreateChannelView.navigationOptions}
      />
      <NewMessageStack.Screen
        name="CreateDiscussionView"
        component={CreateDiscussionView}
      />
    </NewMessageStack.Navigator>
  );
};

// E2ESaveYourPasswordStackNavigator
const E2ESaveYourPasswordStack = createStackNavigator();
const E2ESaveYourPasswordStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <E2ESaveYourPasswordStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <E2ESaveYourPasswordStack.Screen
        name="E2ESaveYourPasswordView"
        component={E2ESaveYourPasswordView}
        options={E2ESaveYourPasswordView.navigationOptions}
      />
      <E2ESaveYourPasswordStack.Screen
        name="E2EHowItWorksView"
        component={E2EHowItWorksView}
        options={E2EHowItWorksView.navigationOptions}
      />
    </E2ESaveYourPasswordStack.Navigator>
  );
};

// E2EEnterYourPasswordStackNavigator
const E2EEnterYourPasswordStack = createStackNavigator();
const E2EEnterYourPasswordStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <E2EEnterYourPasswordStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <E2EEnterYourPasswordStack.Screen
        name="E2EEnterYourPasswordView"
        component={E2EEnterYourPasswordView}
        options={E2EEnterYourPasswordView.navigationOptions}
      />
    </E2EEnterYourPasswordStack.Navigator>
  );
};

// InsideStackNavigator
const InsideStack = createStackNavigator();
const InsideStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <InsideStack.Navigator
      mode="modal"
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...ModalAnimation,
      }}
    >
      <InsideStack.Screen
        name="DrawerNavigator"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <InsideStack.Screen
        name="NewMessageStackNavigator"
        component={NewMessageStackNavigator}
        options={{ headerShown: false }}
      />
      <InsideStack.Screen
        name="E2ESaveYourPasswordStackNavigator"
        component={E2ESaveYourPasswordStackNavigator}
        options={{ headerShown: false }}
      />
      <InsideStack.Screen
        name="E2EEnterYourPasswordStackNavigator"
        component={E2EEnterYourPasswordStackNavigator}
        options={{ headerShown: false }}
      />
      <InsideStack.Screen name="AttachmentView" component={AttachmentView} />
      <InsideStack.Screen name="StatusView" component={StatusView} />
      <InsideStack.Screen name="ShareView" component={ShareView} />
      <InsideStack.Screen
        name="ModalBlockView"
        component={ModalBlockView}
        options={ModalBlockView.navigationOptions}
      />
      <InsideStack.Screen
        name="JitsiMeetView"
        component={JitsiMeetView}
        options={{ headerShown: false }}
      />
    </InsideStack.Navigator>
  );
};

export default InsideStackNavigator;
