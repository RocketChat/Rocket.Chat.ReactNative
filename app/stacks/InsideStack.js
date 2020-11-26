import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { ThemeContext } from "../theme";
import {
  defaultHeader,
  themedHeader,
  ModalAnimation,
  StackAnimation,
} from "../utils/navigation";

import DrawerNavigator from "./InsideStack/DrawerNavigator";

import NewMessageStackNavigator from "./InsideStack/NewMessageStackNavigator";
import E2ESaveYourPasswordStackNavigator from "./InsideStack/E2ESaveYourPasswordStackNavigator";

import AttachmentView from "../views/AttachmentView";
import ModalBlockView from "../views/ModalBlockView";
import JitsiMeetView from "../views/JitsiMeetView";
import StatusView from "../views/StatusView";
import ShareView from "../views/ShareView";

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
