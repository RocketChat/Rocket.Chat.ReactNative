import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  SafeAreaView,
  AsyncStorage,
  Image
} from "react-native";
import { connect } from "react-redux";
import Icon from "@expo/vector-icons/MaterialIcons";
import { StackActions } from "react-navigation";
import i18n from "i18n-js";

import database from "../../main/ran-db/sqlite";
import { selectServerRequest } from "../actions/server";
import { appStart } from "../actions";
import { logout } from "../actions/login";
import Avatar from "../containers/Avatar";
import Status from "../containers/status";
import Touch from "../utils/touch";
import { STATUS_COLORS } from "../constants/colors";
import RocketChat from "../lib/rocketchat";
import log from "../utils/log";
import scrollPersistTaps from "../utils/scrollPersistTaps";
import { serverRequest } from "../actions/server";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  item: {
    flexDirection: "row",
    alignItems: "center"
  },
  itemLeft: {
    marginHorizontal: 10,
    width: 30,
    alignItems: "center"
  },
  itemText: {
    marginVertical: 16,
    fontWeight: "bold",
    color: "#292E35"
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    marginVertical: 4
  },
  serverImage: {
    width: 24,
    height: 24,
    borderRadius: 4
  },
  header: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start"
  },
  headerUsername: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    marginHorizontal: 10
  },
  status: {
    borderRadius: 12,
    width: 12,
    height: 12,
    marginRight: 5
  },
  currentServerText: {
    fontWeight: "bold"
  }
});
const keyExtractor = item => item.id;

@connect(
  state => ({
    server: state.server.server,
    user: {
      id: state.login.user && state.login.user.id,
      language: state.login.user && state.login.user.language,
      server: state.login.user && state.login.user.server,
      status: state.login.user && state.login.user.status,
      username: state.login.user && state.login.user.username
    },
    baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
  }),
  dispatch => ({
    selectServerRequest: server => dispatch(selectServerRequest(server)),
    logout: outside => dispatch(logout(outside)),
    appStart: () => dispatch(appStart("outside")),
    connectServer: server => dispatch(serverRequest(server))
  })
)
export default class Sidebar extends Component {
  static propTypes = {
    baseUrl: PropTypes.string,
    navigator: PropTypes.object,
    server: PropTypes.string.isRequired,
    selectServerRequest: PropTypes.func.isRequired,
    user: PropTypes.object,
    logout: PropTypes.func.isRequired,
    appStart: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.serversToken = null;
    this.state = {
      servers: [],
      showServers: false
    };
  }

  componentDidMount = async () => {
    await this.updateState();
    if (!this.serversToken) {
      this.serversToken = PubSub.subscribe("change", this.updateState);
    }
    this.setStatus();
    // database.databases.serversDB.addListener("change", this.updateState);
  };

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.user &&
      this.props.user &&
      this.props.user.language !== nextProps.user.language
    ) {
      this.setStatus();
    }
  }

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  componentWillUnmount() {
    this.removeListener(this.serversToken);
  }

  onPressItem = item => {
    this.props.selectServerRequest(item.id);
  };

  setStatus = () => {
    setTimeout(() => {
      this.setState({
        status: [
          {
            id: "online",
            name: i18n.t("ran.chat.Online")
          },
          {
            id: "busy",
            name: i18n.t("ran.chat.Busy")
          },
          {
            id: "away",
            name: i18n.t("ran.chat.Away")
          },
          {
            id: "offline",
            name: i18n.t("ran.chat.Invisible")
          }
        ]
      });
    });
  };

  getState = async () => {
    const servers = await database.objects("servers", null, database.serversDB);
    return servers;
  };

  updateState = async () => {
    const servers = await database.objects("servers", null, database.serversDB);
    this.setState({
      servers: servers
    });
  };

  closeDrawer = () => {
    this.props.navigation.goBack();
  };

  toggleServers = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({ showServers: !this.state.showServers });
  };

  toggleLogout = outside => {
    this.props.logout(outside);
    this.props.navigation.dispatch(StackActions.popToTop());
  };

  sidebarNavigate = (screen, title) => {
    this.closeDrawer();
    this.props.navigation.navigate(screen, { title });
  };

  renderSeparator = key => <View key={key} style={styles.separator} />;

  renderItem = ({ text, left, onPress, testID }) => (
    <Touch
      key={text}
      onPress={onPress}
      underlayColor="rgba(255, 255, 255, 0.5)"
      activeOpacity={0.3}
      testID={testID}
    >
      <View style={styles.item}>
        <View style={styles.itemLeft}>{left}</View>
        <Text style={styles.itemText}>{text}</Text>
      </View>
    </Touch>
  );

  renderStatusItem = ({ item }) =>
    this.renderItem({
      text: item.name,
      left: (
        <View
          style={[styles.status, { backgroundColor: STATUS_COLORS[item.id] }]}
        />
      ),
      selected: this.props.user.status === item.id,
      onPress: () => {
        this.closeDrawer();
        this.toggleServers();
        if (this.props.user.status !== item.id) {
          try {
            RocketChat.setUserPresenceDefaultStatus(item.id);
          } catch (e) {
            log("setUserPresenceDefaultStatus", e);
          }
        }
      }
    });

  renderServer = ({ item }) =>
    this.renderItem({
      text: item.id,
      left: (
        <Image
          style={styles.serverImage}
          source={{ uri: encodeURI(`${item.id}/assets/favicon_32.png`) }}
        />
      ),
      selected: this.props.server === item.id,
      onPress: async () => {
        this.closeDrawer();
        this.toggleServers();
        if (this.props.server !== item.id) {
          this.props.appStart();
          this.props.logout();

          setTimeout(() => {
            this.props.connectServer(item.id);
          }, 1000);
        }
      },
      testID: `sidebar-${item.id}`
    });

  renderNavigation = () => [
    this.renderItem({
      text: i18n.t("ran.chat.Chats"),
      left: <Icon name="chat-bubble" size={20} />,
      onPress: () =>
        this.sidebarNavigate("RoomsListView", i18n.t("ran.chat.Messages")),
      testID: "sidebar-chats"
    }),
    this.renderItem({
      text: i18n.t("ran.chat.Profile"),
      left: <Icon name="person" size={20} />,
      onPress: () =>
        this.sidebarNavigate("ProfileView", i18n.t("ran.chat.Profile")),
      testID: "sidebar-profile"
    }),
    this.renderItem({
      text: i18n.t("ran.chat.Settings"),
      left: <Icon name="settings" size={20} />,
      onPress: () =>
        this.sidebarNavigate("SettingsView", i18n.t("ran.chat.Settings")),
      testID: "sidebar-settings"
    }),
    this.renderSeparator("separator-logout"),
    this.renderItem({
      text: i18n.t("ran.chat.Logout"),
      left: <Icon name="exit-to-app" size={20} />,
      onPress: () => {
        this.toggleLogout(true);
      },
      testID: "sidebar-logout"
    })
  ];

  renderServers = () => [
    <FlatList
      key="status-list"
      data={this.state.status}
      extraData={this.props.user}
      renderItem={this.renderStatusItem}
      keyExtractor={keyExtractor}
    />,
    this.renderSeparator("separator-status"),
    <FlatList
      key="servers-list"
      data={this.state.servers}
      extraData={this.props.server}
      renderItem={this.renderServer}
      keyExtractor={keyExtractor}
    />,
    this.renderSeparator("separator-add-server"),
    this.renderItem({
      text: i18n.t("ran.chat.Add_Server"),
      left: <Icon name="add" size={20} />,
      onPress: () => {
        this.toggleServers();
        this.closeDrawer();
        this.props.navigation.navigate("NewServerView", {
          title: i18n.t("ran.chat.Add_Server"),
          previousServer: this.props.server
        });
      },
      testID: "sidebar-add-server"
    })
  ];

  render() {
    const { user, server, baseUrl } = this.props;
    if (!user) {
      return null;
    }
    return (
      <SafeAreaView testID="sidebar" style={styles.container}>
        <ScrollView style={styles.container} {...scrollPersistTaps}>
          <Touch
            onPress={() => this.toggleServers()}
            underlayColor="rgba(255, 255, 255, 0.5)"
            activeOpacity={0.3}
            testID="sidebar-toggle-server"
          >
            <View style={styles.header}>
              <Avatar
                text={user.username}
                size={30}
                style={styles.avatar}
                baseUrl={baseUrl}
              />
              <View style={styles.headerTextContainer}>
                <View style={styles.headerUsername}>
                  <Status style={styles.status} id={user.id} />
                  <Text numberOfLines={1}>{user.username}</Text>
                </View>
                <Text style={styles.currentServerText} numberOfLines={1}>
                  {server}
                </Text>
              </View>
              <Icon
                name={
                  this.state.showServers
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={30}
                style={{ paddingHorizontal: 10 }}
              />
            </View>
          </Touch>

          {this.renderSeparator("separator-header")}

          {!this.state.showServers ? this.renderNavigation() : null}
          {this.state.showServers ? this.renderServers() : null}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
