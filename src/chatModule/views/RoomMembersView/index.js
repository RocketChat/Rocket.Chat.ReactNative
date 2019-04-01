import React from "react";
import PropTypes from "prop-types";
import {
  FlatList,
  View,
  Vibration,
  SafeAreaView,
  TouchableOpacity,
  Text
} from "react-native";
import ActionSheet from "react-native-actionsheet";
import PubSub from "pubsub-js";
import { connect } from "react-redux";
import Icon from "@expo/vector-icons/Ionicons";
import { StackActions } from "react-navigation";
import i18n from "i18n-js";

import LoggedView from "../View";
import styles from "./styles";
import UserItem from "../../presentation/UserItem";
import scrollPersistTaps from "../../utils/scrollPersistTaps";
import RocketChat from "../../lib/rocketchat";
import database from "../../../main/ran-db/sqlite";
import { showToast } from "../../utils/info";
import log from "../../utils/log";
import SearchBox from "../../containers/SearchBox";

@connect(state => ({
  baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
}))
/** @extends React.Component */
export default class RoomMembersView extends LoggedView {
  static propTypes = {
    // rid: PropTypes.string,
    // members: PropTypes.array,
    baseUrl: PropTypes.string
  };

  constructor(props) {
    super("MentionedMessagesView", props);
    this.CANCEL_INDEX = 0;
    this.MUTE_INDEX = 1;
    this.actionSheetOptions = [""];
    const { rid, members } = props.navigation.state.params;
    this.rooms = null;
    this.roomsToken = null;
    this.permissions = null;
    this.state = {
      allUsers: false,
      filtering: false,
      rid,
      members,
      membersFiltered: [],
      userLongPressed: {},
      room: {}
    };
  }

  static navigationOptions = props => {
    const { navigation } = props;
    return {
      title: i18n.t("ran.chat.Members"),
      headerBackTitle: null,
      headerBackImage: (
        <Icon
          name="ios-arrow-back"
          style={{ marginHorizontal: 15 }}
          size={22}
          color="#4674F1"
        />
      ),
      headerRight: (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={{ marginHorizontal: 15 }}
            onPress={() => {
              navigation.state.params.toggleOnline();
            }}
          >
            {/* <Icon name="ios-contacts" size={22} color="#4674F1" /> */}
            <Text style={{ color: "#4674F1" }}>
              {navigation.state.params.allUsers
                ? i18n.t("ran.chat.Online")
                : i18n.t("ran.chat.All")}
            </Text>
          </TouchableOpacity>
        </View>
      )
    };
  };

  async componentDidMount() {
    this.props.navigation.setParams({
      toggleOnline: this.toggleOnline,
      allUsers: this.state.allUsers
    });

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

  toggleOnline = async () => {
    try {
      const allUsers = !this.state.allUsers;
      const membersResult = await RocketChat.getRoomMembers(
        this.state.rid,
        allUsers
      );
      const members = membersResult.records;
      this.setState({ allUsers, members });

      this.props.navigation.setParams({
        allUsers: allUsers
      });
    } catch (e) {
      log("RoomMembers.onNavigationButtonPressed", e);
    }
  };

  onSearchChangeText = text => {
    let membersFiltered = [];
    if (text) {
      membersFiltered = this.state.members.filter(m =>
        m.username.toLowerCase().match(text.toLowerCase())
      );
    }
    this.setState({ filtering: !!text, membersFiltered });
  };

  onPressUser = async item => {
    try {
      const subscriptions = await database.objects(
        "subscriptions",
        `WHERE name="${item.username}"`
      );
      if (subscriptions.length) {
        this.goRoom({ rid: subscriptions[0].rid, name: subscriptions[0].name });
      } else {
        const room = await RocketChat.createDirectMessage(item.username);
        this.goRoom({ rid: room.rid, name: item.username });
      }
    } catch (e) {
      log("onPressUser", e);
    }
  };

  onLongPressUser = user => {
    if (!this.permissions) {
      return;
    }
    this.actionSheetOptions = [i18n.t("ran.chat.Cancel")];
    const muted = JSON.parse(this.state.room.muted);
    const userIsMuted = !!muted.find(m => m.value === user.username);
    user.muted = userIsMuted;
    if (userIsMuted) {
      this.actionSheetOptions.push(i18n.t("ran.chat.Unmute"));
    } else {
      this.actionSheetOptions.push(i18n.t("ran.chat.Mute"));
    }
    this.setState({ userLongPressed: user });
    Vibration.vibrate(50);
    if (this.actionSheet && this.actionSheet.show) {
      this.actionSheet.show();
    }
  };

  updateRoom = async () => {
    const [room] = await database.objects(
      "subscriptions",
      `WHERE rid = "${this.props.navigation.state.params.rid}"`
    );
    this.permissions = await RocketChat.hasPermission(
      ["mute-user"],
      this.props.navigation.state.params.rid
    );

    await this.setState({ room });
  };

  goRoom = ({ rid, name }) => {
    this.props.navigation.dispatch(
      StackActions.pop({
        n: 3
      })
    );
    setTimeout(() => {
      this.props.navigation.navigate("RoomView", {
        title: name,
        rid: rid
      });
    }, 1000);
  };

  handleMute = async () => {
    const { rid, userLongPressed } = this.state;
    try {
      await RocketChat.toggleMuteUserInRoom(
        rid,
        userLongPressed.username,
        !userLongPressed.muted
      );

      userLongPressed.muted
        ? showToast(i18n.t("ran.chat.User_has_been_unmuted"))
        : showToast(i18n.t("ran.chat.User_has_been_muted"));
    } catch (e) {
      log("handleMute", e);
    }
  };

  handleActionPress = actionIndex => {
    switch (actionIndex) {
      case this.MUTE_INDEX:
        this.handleMute();
        break;
      default:
        break;
    }
  };

  renderSearchBar = () => (
    <SearchBox
      onChangeText={text => this.onSearchChangeText(text)}
      testID="room-members-view-search"
    />
  );

  renderSeparator = () => <View style={styles.separator} />;

  renderItem = ({ item }) => (
    <UserItem
      name={item.name}
      username={item.username}
      onPress={() => this.onPressUser(item)}
      onLongPress={() => this.onLongPressUser(item)}
      baseUrl={this.props.baseUrl}
      testID={`room-members-view-item-${item.username}`}
    />
  );

  render() {
    const { filtering, members, membersFiltered } = this.state;
    return (
      <SafeAreaView style={styles.list} testID="room-members-view">
        <FlatList
          data={filtering ? membersFiltered : members}
          renderItem={this.renderItem}
          style={styles.list}
          keyExtractor={item => item._id}
          ItemSeparatorComponent={this.renderSeparator}
          ListHeaderComponent={this.renderSearchBar}
          {...scrollPersistTaps}
        />
        <ActionSheet
          ref={o => (this.actionSheet = o)}
          title={i18n.t("ran.chat.Actions")}
          options={this.actionSheetOptions}
          cancelButtonIndex={this.CANCEL_INDEX}
          onPress={this.handleActionPress}
        />
      </SafeAreaView>
    );
  }
}
