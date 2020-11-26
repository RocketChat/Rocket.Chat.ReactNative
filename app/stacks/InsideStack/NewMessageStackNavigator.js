import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import NewMessageView from "../views/NewMessageView";
import CreateChannelView from "../views/CreateChannelView";
import CreateDiscussionView from "../views/CreateDiscussionView";
import SelectedUsersView from "../views/SelectedUsersView";

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

export default NewMessageStackNavigator;
