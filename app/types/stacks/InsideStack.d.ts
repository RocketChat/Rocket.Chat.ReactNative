import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type ChatStackParamList = {
  RoomsListView: undefined;
  RoomView: undefined;
  RoomActionsView: undefined;
  RoomInfoView: undefined;
  RoomInfoEditView: undefined;
  RoomMembersView: undefined;
  SearchMessagesView: undefined;
  SelectedUsersView: undefined;
  InviteUsersView: undefined;
  InviteUsersEditView: undefined;
  MessagesView: undefined;
  AutoTranslateView: undefined;
  DirectoryView: undefined;
  NotificationPrefView: undefined;
  VisitorNavigationView: undefined;
  ForwardLivechatView: undefined;
  LivechatEditView: undefined;
  PickerView: undefined;
  ThreadMessagesView: undefined;
  MarkdownTableView: undefined;
  ReadReceiptsView: undefined;
  QueueListView: undefined;
};

export interface ChatNavProps<T extends keyof ChatStackParamList> {
  navigation: StackNavigationProp<ChatStackParamList, T>;
  route: RouteProp<ChatStackParamList, T>;
}
