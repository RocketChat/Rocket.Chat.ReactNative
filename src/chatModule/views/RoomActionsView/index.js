import React from "react";
import PropTypes from "prop-types";
import { View, SectionList, Text, Alert, SafeAreaView } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import MaterialIcon from "@expo/vector-icons/MaterialIcons";
import { connect } from "react-redux";
import PubSub from "pubsub-js";
import i18n from "i18n-js";

import LoggedView from "../View";
import styles from "./styles";
import sharedStyles from "../Styles";
import Avatar from "../../containers/Avatar";
import Status from "../../containers/status";
import Touch from "../../utils/touch";
import database from "../../../main/ran-db/sqlite";
import RocketChat from "../../lib/rocketchat";
import { leaveRoom } from "../../actions/room";
import log from "../../utils/log";
import RoomTypeIcon from "../../containers/RoomTypeIcon";
import scrollPersistTaps from "../../utils/scrollPersistTaps";

const renderSeparator = () => <View style={styles.separator} />;

@connect(
  state => ({
    userId: state.login.user && state.login.user.id,
    username: state.login.user && state.login.user.username,
    baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
  }),
  dispatch => ({
    leaveRoom: rid => dispatch(leaveRoom(rid))
  })
)
/** @extends React.Component */
export default class RoomActionsView extends LoggedView {
  static propTypes = {
    baseUrl: PropTypes.string,
    rid: PropTypes.string,
    navigator: PropTypes.object,
    userId: PropTypes.string,
    username: PropTypes.string,
    leaveRoom: PropTypes.func
  };

  constructor(props) {
    super("RoomActionsView", props);
    this.rooms = {};
    this.roomsToken = null;
    this.onlineMembers = [];
    this.allMembers = [];
    this.member = {};
    this.canViewMembers = false;
    this.canAddUser = false;
    this.state = {
      room: {},
      onlineMembers: [],
      allMembers: [],
      member: {}
    };
  }

  static navigationOptions = props => {
    return {
      title: i18n.t("ran.chat.Details"),
      headerBackTitle: null,
      headerBackImage: (
        <Icon
          name="ios-arrow-back"
          style={{ marginHorizontal: 15 }}
          size={22}
          color="#4674F1"
        />
      )
    };
  };

  async componentDidMount() {
    await this.updateRoom();
    if (!this.roomsToken) {
      this.roomsToken = PubSub.subscribe("subscriptions", this.updateRoom);
    }
  }

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  componentWillUnmount() {
    this.removeListener(this.roomsToken);
  }

  onPressTouchable = item => {
    if (item.route) {
      this.props.navigation.navigate(item.route, {
        title: item.name,
        ...item.params
      });
    }
    if (item.event) {
      return item.event();
    }
  };

  getCanAddUser = async () => {
    // Invite user
    const { rid, t } = this.room;
    // TODO: same test joined
    const userInRoom = !!this.allMembers.find(
      m => m.username === this.props.username
    );
    const permissions = await RocketChat.hasPermission(
      [
        "add-user-to-joined-room",
        "add-user-to-any-c-room",
        "add-user-to-any-p-room"
      ],
      rid
    );

    if (userInRoom && permissions["add-user-to-joined-room"]) {
      return true;
    }
    if (t === "c" && permissions["add-user-to-any-c-room"]) {
      return true;
    }
    if (t === "p" && permissions["add-user-to-any-p-room"]) {
      return true;
    }
    return false;
  };

  getCanViewMembers = async () => {
    const { rid, t, broadcast } = this.room;
    if (broadcast) {
      const viewBroadcastMemberListPermission = "view-broadcast-member-list";
      const permissions = await RocketChat.hasPermission(
        [viewBroadcastMemberListPermission],
        rid
      );
      if (!permissions[viewBroadcastMemberListPermission]) {
        return false;
      }
    }
    return t === "c" || t === "p";
  };
  getSections = () => {
    const { rid, t, blocker, notifications } = this.state.room;
    const { onlineMembers } = this.state;

    const sections = [
      {
        data: [
          {
            icon: "ios-star",
            name: i18n.t("ran.chat.Room_Info"),
            route: "RoomInfoView",
            params: { rid },
            testID: "room-actions-info"
          }
        ],
        renderItem: this.renderRoomInfo
      },
      {
        data: [
          {
            icon: "ios-call",
            name: i18n.t("ran.chat.Voice_call"),
            disabled: true,
            testID: "room-actions-voice"
          },
          {
            icon: "ios-videocam",
            name: i18n.t("ran.chat.Video_call"),
            disabled: true,
            testID: "room-actions-video"
          }
        ],
        renderItem: this.renderItem
      },
      {
        data: [
          {
            icon: "ios-attach",
            name: i18n.t("ran.chat.Files"),
            route: "RoomFilesView",
            params: { rid },
            testID: "room-actions-files"
          },
          {
            icon: "ios-at",
            name: i18n.t("ran.chat.Mentions"),
            route: "MentionedMessagesView",
            params: { rid },
            testID: "room-actions-mentioned"
          },
          {
            icon: "ios-star",
            name: i18n.t("ran.chat.Starred"),
            route: "StarredMessagesView",
            params: { rid },
            testID: "room-actions-starred"
          },
          {
            icon: "ios-search",
            name: i18n.t("ran.chat.Search"),
            route: "SearchMessagesView",
            params: { rid },
            testID: "room-actions-search"
          },
          {
            icon: "ios-share",
            name: i18n.t("ran.chat.Share"),
            disabled: true,
            testID: "room-actions-share"
          },
          {
            icon: "ios-pin",
            name: i18n.t("ran.chat.Pinned"),
            route: "PinnedMessagesView",
            params: { rid },
            testID: "room-actions-pinned"
          },
          {
            icon: "ios-code",
            name: i18n.t("ran.chat.Snippets"),
            route: "SnippetedMessagesView",
            params: { rid },
            testID: "room-actions-snippeted"
          },
          {
            icon: `ios-notifications${notifications ? "" : "-off"}`,
            name: i18n.t(
              `ran.chat.${notifications ? "Enable" : "Disable"}_notifications`
            ),
            event: () => this.toggleNotifications(),
            testID: "room-actions-notifications"
          }
        ],
        renderItem: this.renderItem
      }
    ];

    if (t === "d") {
      sections.push({
        data: [
          {
            icon: "block",
            name: i18n.t(`ran.chat.${blocker ? "Unblock" : "Block"}_user`),
            type: "danger",
            event: () => this.toggleBlockUser(),
            testID: "room-actions-block-user"
          }
        ],
        renderItem: this.renderItem
      });
    } else if (t === "c" || t === "p") {
      const actions = [];

      if (this.canViewMembers) {
        actions.push({
          icon: "ios-people",
          name: i18n.t("ran.chat.Members"),
          description:
            onlineMembers.length === 1
              ? i18n.t("ran.chat.One_online_member")
              : onlineMembers.length + i18n.t("ran.chat.N_online_members"),
          route: "RoomMembersView",
          params: { rid, members: onlineMembers },
          testID: "room-actions-members"
        });
      }

      if (this.canAddUser) {
        actions.push({
          icon: "ios-person-add",
          name: i18n.t("ran.chat.Add_user"),
          route: "SelectedUsersView",
          params: {
            nextAction: "ADD_USER",
            rid
          },
          testID: "room-actions-add-user"
        });
      }
      sections[2].data = [...actions, ...sections[2].data];
      sections.push({
        data: [
          {
            icon: "block",
            name: i18n.t("ran.chat.Leave_channel"),
            type: "danger",
            event: () => this.leaveChannel(),
            testID: "room-actions-leave-channel"
          }
        ],
        renderItem: this.renderItem
      });
    }
    return sections;
  };

  updateRoomMembers = async () => {
    const { t } = this.room;

    if (!this.canViewMembers) {
      return {};
    }

    if (t === "c" || t === "p") {
      this.onlineMembers = [];
      this.allMembers = [];
      try {
        const onlineMembersCall = RocketChat.getRoomMembers(
          this.room.rid,
          false
        );
        const allMembersCall = RocketChat.getRoomMembers(this.room.rid, true);
        const [onlineMembersResult, allMembersResult] = await Promise.all([
          onlineMembersCall,
          allMembersCall
        ]);
        this.onlineMembers = onlineMembersResult.records;
        this.allMembers = allMembersResult.records;

        return {
          onlineMembers: this.onlineMembers,
          allMembers: this.allMembers
        };
      } catch (error) {
        return {};
      }
    }
  };

  updateRoomMember = async () => {
    if (this.room.t !== "d") {
      return {};
    }
    try {
      const member = await RocketChat.getRoomMember(
        this.room.rid,
        this.props.userId
      );
      return { member };
    } catch (e) {
      log("RoomActions updateRoomMember", e);
      return {};
    }
  };

  updateRoom = async () => {
    const { rid } = this.props.navigation.state.params;
    this.rooms = await database.objects(
      "subscriptions",
      `WHERE rid == "${rid}"`
    );
    [this.room] = this.rooms;

    this.canViewMembers = await this.getCanViewMembers();

    const [members, member] = await Promise.all([
      this.updateRoomMembers(),
      this.updateRoomMember()
    ]);

    this.canAddUser = await this.getCanAddUser();
    // this.sections = await this.getSections();
    this.setState({ ...members, ...member, room: this.room });
  };

  toggleBlockUser = async () => {
    const { rid, blocker } = this.state.room;
    const { member } = this.state;
    try {
      RocketChat.toggleBlockUser(rid, member._id, !blocker);
    } catch (e) {
      log("toggleBlockUser", e);
    }
  };

  leaveChannel = () => {
    const { room } = this.state;
    Alert.alert(
      i18n.t("ran.chat.Are_you_sure_question_mark"),
      i18n.t("ran.chat.Are_you_sure_you_want_to_leave_the_room") +
        `${room.t === "d" ? room.fname : room.name}`,
      [
        {
          text: i18n.t("ran.chat.Cancel"),
          style: "cancel"
        },
        {
          text: i18n.t("ran.chat.Yes_action_leave"),
          style: "destructive",
          onPress: () => {
            this.props.navigation.pop(2);
            setTimeout(() => {
              this.props.leaveRoom(room.rid);
            }, 1000);
          }
        }
      ]
    );
  };

  toggleNotifications = () => {
    const { room } = this.state;
    try {
      RocketChat.saveNotificationSettings(
        room.rid,
        "mobilePushNotifications",
        room.notifications ? "default" : "nothing"
      );
    } catch (e) {
      log("toggleNotifications", e);
    }
  };

  renderRoomInfo = ({ item }) => {
    const { room, member } = this.state;
    const { name, t, topic } = room;
    return this.renderTouchableItem(
      [
        <Avatar
          key="avatar"
          text={name}
          size={50}
          style={styles.avatar}
          type={t}
          baseUrl={this.props.baseUrl}
        >
          {t === "d" ? (
            <Status style={sharedStyles.status} id={member._id} />
          ) : null}
        </Avatar>,
        <View key="name" style={styles.roomTitleContainer}>
          {room.t === "d" ? (
            <Text style={styles.roomTitle}>{room.fname}</Text>
          ) : (
            <View style={styles.roomTitleRow}>
              <RoomTypeIcon type={room.t} />
              <Text style={styles.roomTitle}>{room.name}</Text>
            </View>
          )}
          <Text
            style={styles.roomDescription}
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {t === "d" ? `@${name}` : topic}
          </Text>
        </View>,
        <Icon
          key="icon"
          name="ios-arrow-forward"
          size={20}
          style={styles.sectionItemIcon}
          color="#ccc"
        />
      ],
      item
    );
  };

  renderTouchableItem = (subview, item) => (
    <Touch
      onPress={() => this.onPressTouchable(item)}
      underlayColor="#FFFFFF"
      activeOpacity={0.5}
      accessibilityLabel={item.name}
      accessibilityTraits="button"
      testID={item.testID}
    >
      <View
        style={[
          styles.sectionItem,
          item.disabled && styles.sectionItemDisabled
        ]}
      >
        {subview}
      </View>
    </Touch>
  );

  renderItem = ({ item }) => {
    const subview =
      item.type === "danger"
        ? [
            <MaterialIcon
              key="icon"
              name={item.icon}
              size={20}
              style={[styles.sectionItemIcon, styles.textColorDanger]}
            />,
            <Text
              key="name"
              style={[styles.sectionItemName, styles.textColorDanger]}
            >
              {item.name}
            </Text>
          ]
        : [
            <Icon
              key="left-icon"
              name={item.icon}
              size={24}
              style={styles.sectionItemIcon}
            />,
            <Text key="name" style={styles.sectionItemName}>
              {item.name}
            </Text>,
            item.description ? (
              <Text key="description" style={styles.sectionItemDescription}>
                {item.description}
              </Text>
            ) : null,
            <Icon
              key="right-icon"
              name="ios-arrow-forward"
              size={20}
              style={styles.sectionItemIcon}
              color="#ccc"
            />
          ];
    return this.renderTouchableItem(subview, item);
  };

  renderSectionSeparator = data => {
    if (data.trailingItem) {
      return (
        <View
          style={[
            styles.sectionSeparator,
            data.leadingSection && styles.sectionSeparatorBorder
          ]}
        />
      );
    }
    if (!data.trailingSection) {
      return <View style={styles.sectionSeparatorBorder} />;
    }
    return null;
  };

  render() {
    console.log("render RoomActionsView");

    this.sections = this.getSections();

    return (
      <SafeAreaView style={styles.container} testID="room-actions-view">
        <SectionList
          style={styles.container}
          stickySectionHeadersEnabled={false}
          sections={this.room ? (this.sections ? this.sections : []) : []}
          extraData={this.state.room}
          SectionSeparatorComponent={this.renderSectionSeparator}
          ItemSeparatorComponent={renderSeparator}
          keyExtractor={item => item.name}
          testID="room-actions-list"
          {...scrollPersistTaps}
        />
      </SafeAreaView>
    );
  }
}
