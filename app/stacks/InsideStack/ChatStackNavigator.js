import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import RoomView from "../views/RoomView";
import RoomsListView from "../views/RoomsListView";
import RoomActionsView from "../views/RoomActionsView";
import RoomInfoView from "../views/RoomInfoView";
import RoomInfoEditView from "../views/RoomInfoEditView";
import RoomMembersView from "../views/RoomMembersView";
import SearchMessagesView from "../views/SearchMessagesView";
import SelectedUsersView from "../views/SelectedUsersView";
import InviteUsersView from "../views/InviteUsersView";
import InviteUsersEditView from "../views/InviteUsersEditView";
import MessagesView from "../views/MessagesView";
import AutoTranslateView from "../views/AutoTranslateView";
import DirectoryView from "../views/DirectoryView";
import NotificationPrefView from "../views/NotificationPreferencesView";
import VisitorNavigationView from "../views/VisitorNavigationView";
import ForwardLivechatView from "../views/ForwardLivechatView";
import LivechatEditView from "../views/LivechatEditView";
import PickerView from "../views/PickerView";
import ThreadMessagesView from "../views/ThreadMessagesView";
import MarkdownTableView from "../views/MarkdownTableView";
import ReadReceiptsView from "../views/ReadReceiptView";

const ChatsStack = createStackNavigator();
const ChatsStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);
  return (
    <ChatsStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <ChatsStack.Screen name="RoomsListView" component={RoomsListView} />
      <ChatsStack.Screen name="RoomView" component={RoomView} />
      <ChatsStack.Screen
        name="RoomActionsView"
        component={RoomActionsView}
        options={RoomActionsView.navigationOptions}
      />
      <ChatsStack.Screen
        name="RoomInfoView"
        component={RoomInfoView}
        options={RoomInfoView.navigationOptions}
      />
      <ChatsStack.Screen
        name="RoomInfoEditView"
        component={RoomInfoEditView}
        options={RoomInfoEditView.navigationOptions}
      />
      <ChatsStack.Screen
        name="RoomMembersView"
        component={RoomMembersView}
        options={RoomMembersView.navigationOptions}
      />
      <ChatsStack.Screen
        name="SearchMessagesView"
        component={SearchMessagesView}
        options={SearchMessagesView.navigationOptions}
      />
      <ChatsStack.Screen
        name="SelectedUsersView"
        component={SelectedUsersView}
      />
      <ChatsStack.Screen
        name="InviteUsersView"
        component={InviteUsersView}
        options={InviteUsersView.navigationOptions}
      />
      <ChatsStack.Screen
        name="InviteUsersEditView"
        component={InviteUsersEditView}
        options={InviteUsersEditView.navigationOptions}
      />
      <ChatsStack.Screen name="MessagesView" component={MessagesView} />
      <ChatsStack.Screen
        name="AutoTranslateView"
        component={AutoTranslateView}
        options={AutoTranslateView.navigationOptions}
      />
      <ChatsStack.Screen
        name="DirectoryView"
        component={DirectoryView}
        options={DirectoryView.navigationOptions}
      />
      <ChatsStack.Screen
        name="NotificationPrefView"
        component={NotificationPrefView}
        options={NotificationPrefView.navigationOptions}
      />
      <ChatsStack.Screen
        name="VisitorNavigationView"
        component={VisitorNavigationView}
        options={VisitorNavigationView.navigationOptions}
      />
      <ChatsStack.Screen
        name="ForwardLivechatView"
        component={ForwardLivechatView}
        options={ForwardLivechatView.navigationOptions}
      />
      <ChatsStack.Screen
        name="LivechatEditView"
        component={LivechatEditView}
        options={LivechatEditView.navigationOptions}
      />
      <ChatsStack.Screen
        name="PickerView"
        component={PickerView}
        options={PickerView.navigationOptions}
      />
      <ChatsStack.Screen
        name="ThreadMessagesView"
        component={ThreadMessagesView}
        options={ThreadMessagesView.navigationOptions}
      />
      <ChatsStack.Screen
        name="MarkdownTableView"
        component={MarkdownTableView}
        options={MarkdownTableView.navigationOptions}
      />
      <ChatsStack.Screen
        name="ReadReceiptsView"
        component={ReadReceiptsView}
        options={ReadReceiptsView.navigationOptions}
      />
      <ChatsStack.Screen
        name="QueueListView"
        component={QueueListView}
        options={QueueListView.navigationOptions}
      />
    </ChatsStack.Navigator>
  );
};

export default ChatsStackNavigator;
