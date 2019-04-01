import React from "react";
import PropTypes from "prop-types";
import {
  Platform,
  View,
  FlatList,
  BackHandler,
  ActivityIndicator,
  SafeAreaView,
  Text,
  Image,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";
import { isEqual } from "lodash";
import PubSub from "pubsub-js";
import Icon from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import i18n from "i18n-js";

import SearchBox from "../../containers/SearchBox";
import database from "../../../main/ran-db/sqlite";
import RocketChat from "../../lib/rocketchat";
import RoomItem from "../../presentation/RoomItem";
import styles from "./styles";
import LoggedView from "../View";
import log from "../../utils/log";
import SortDropdown from "./SortDropdown";
import ServerDropdown from "./ServerDropdown";
import Touch from "../../utils/touch";
import { toggleSortDropdown } from "../../actions/rooms";

const ROW_HEIGHT = 70;
const SCROLL_OFFSET = 56;

const isAndroid = () => Platform.OS === "android";
const getItemLayout = (data, index) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index
});

@connect(
  state => ({
    userId: state.login.user && state.login.user.id,
    server: state.server.server,
    baseUrl: state.settings.baseUrl || state.server ? state.server.server : "",
    searchText: state.rooms.searchText,
    loadingServer: state.server.loading,
    showServerDropdown: state.rooms.showServerDropdown,
    showSortDropdown: state.rooms.showSortDropdown,
    sortBy: state.sortPreferences.sortBy,
    groupByType: state.sortPreferences.groupByType,
    showFavorites: state.sortPreferences.showFavorites,
    showUnread: state.sortPreferences.showUnread,
    useRealName: state.settings.UI_Use_Real_Name
  }),
  dispatch => ({
    toggleSortDropdown: () => dispatch(toggleSortDropdown())
  })
)

/** @extends React.Component */
export default class RoomsListView extends LoggedView {
  static propTypes = {
    navigation: PropTypes.object,
    userId: PropTypes.string,
    baseUrl: PropTypes.string,
    server: PropTypes.string,
    searchText: PropTypes.string,
    loadingServer: PropTypes.bool,
    showServerDropdown: PropTypes.bool,
    showSortDropdown: PropTypes.bool,
    sortBy: PropTypes.string,
    groupByType: PropTypes.bool,
    showFavorites: PropTypes.bool,
    showUnread: PropTypes.bool,
    toggleSortDropdown: PropTypes.func,
    useRealName: PropTypes.bool
  };

  static navigationOptions = props => {
    const { navigation, screenProps } = props;
    return {
      title: navigation.getParam("title"),
      headerBackTitle: null,
      headerRight: (
        <View style={{ flexDirection: "row" }}>
          {Platform.OS === "android" ? (
            <TouchableOpacity onPress={() => {}}>
              <Icon name="ios-search" size={22} color="#4674F1" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={{ marginHorizontal: 15 }}
            onPress={() => {
              navigation.navigate("NewMessageView", {
                title: i18n.t("ran.chat.New_Message"),
                onPressItem: navigation.state.params.onPressItem
              });
            }}
          >
            <Icon name="md-add" size={22} color="#4674F1" />
          </TouchableOpacity>
        </View>
      ),
      headerLeft: (
        <TouchableOpacity
          style={{ marginHorizontal: 15 }}
          onPress={() => {
            navigation.toggleDrawer();
          }}
        >
          <Feather name="settings" size={20} color="#4674F1" />
        </TouchableOpacity>
      )
    };
  };

  constructor(props) {
    super("RoomsListView", props);

    this.data = [];
    this.chats = [];
    this.unread = [];
    this.favorites = [];
    this.channels = [];
    this.privateGroup = [];
    this.direct = [];
    this.livechat = [];
    this.unreadToken = null;
    this.favoritesToken = null;
    this.groupByTypeToken = null;
    this.chatsToken = null;

    this.state = {
      search: [],
      loading: true,
      chats: [],
      unread: [],
      favorites: [],
      channels: [],
      privateGroup: [],
      direct: [],
      livechat: []
    };
  }

  componentWillMount() {
    this.props.navigation.setParams({ onPressItem: this._onPressItem });
  }

  componentDidMount() {
    console.log("componentDidMount");

    this.getSubscriptions();
  }

  componentWillReceiveProps(nextProps) {
    console.log("componentWillReceiveProps");

    if (
      nextProps.server &&
      this.props.loadingServer !== nextProps.loadingServer
    ) {
      if (nextProps.loadingServer) {
        this.setState({ loading: true });
      } else {
        console.log("20190311");

        this.getSubscriptions();
      }
    } else if (this.props.searchText !== nextProps.searchText) {
      this.search(nextProps.searchText);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log("shouldComponentUpdate");

    return !(isEqual(this.props, nextProps) && isEqual(this.state, nextState));
  }

  componentDidUpdate(prevProps) {
    console.log("componentDidUpdate");

    if (
      !(
        prevProps.sortBy === this.props.sortBy &&
        prevProps.groupByType === this.props.groupByType &&
        prevProps.showFavorites === this.props.showFavorites &&
        prevProps.showUnread === this.props.showUnread
      )
    ) {
      this.getSubscriptions();
    }
  }

  componentWillUnmount() {
    this.removeListener(this.chatsToken);
    this.removeListener(this.unreadToken);
    this.removeListener(this.favoritesToken);
    this.removeListener(this.groupByTypeToken);
    this.removeListener(this.defaultToken);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  getUnread = async condition => {
    let unread = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and (unread > 0 OR alert = 1) order by ${condition}, name desc`
    );
    this.unread = unread.slice();
    if (!isEqual(this.unread, this.state.unread)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("unread updating");
      this.setState({ unread: this.unread });
    }
  };

  getFavorites = async condition => {
    let favorites = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and f = 1 order by ${condition}`
    );
    this.favorites = favorites.slice();
    if (!isEqual(this.favorites, this.state.favorites)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("favorites updating");
      this.setState({ favorites: this.favorites });
    }
  };

  getChannels = async condition => {
    let channels = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and t = "c" order by ${condition}`
    );
    this.channels = channels.slice();
    if (!isEqual(this.channels, this.state.channels)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("channels updating");

      this.setState({ channels: this.channels });
    }
  };

  getPrivateGroup = async condition => {
    let privateGroup = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and t = "p" order by ${condition}`
    );
    this.privateGroup = privateGroup.slice();

    if (!isEqual(this.privateGroup, this.state.privateGroup)) {
      //!_.isEqualWith(this.unread, newUnread)
      this.setState({ privateGroup: this.privateGroup });
    }
  };

  getDirect = async condition => {
    let direct = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and t = "d" order by ${condition}`
    );
    this.direct = direct.slice();
    if (!isEqual(this.direct, this.state.direct)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("direct updating");
      this.setState({ direct: this.direct });
    }
  };

  getLivechat = async condition => {
    let livechat = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and t = "l" order by ${condition}`
    );
    this.livechat = livechat.slice();

    if (!isEqual(this.livechat, this.state.livechat)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("livechat updating");
      this.setState({ livechat: this.livechat });
    }
  };

  getChatsUnread = async condition => {
    let chats = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 and unread = 0 and alert = 0 order by ${condition}`
    );
    this.chats = chats.slice();

    if (!isEqual(this.chats, this.state.chats)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("chats updating");
      this.setState({ chats: this.chats });
    }
  };

  getChatsDefault = async condition => {
    let chats = await database.objects(
      "subscriptions",
      `WHERE (archived = 0 OR archived is null) and open = 1 order by ${condition}`
    );
    this.chats = chats.slice();

    if (!isEqual(this.chats, this.state.chats)) {
      //!_.isEqualWith(this.unread, newUnread)
      console.log("chats updating");
      this.setState({ chats: this.chats });
    }
  };

  getSubscriptions = async () => {
    if (this.props.server && this.hasActiveDB()) {
      if (this.props.sortBy === "alphabetical") {
        // this.data = await database.objects(
        //   "subscriptions",
        //   "WHERE (archived = 0 OR archived is null) and open = 1 order by name asc"
        // );
        this.data = "name asc";
      } else {
        // this.data = await database.objects(
        //   "subscriptions",
        //   "WHERE (archived = 0 OR archived is null) and open = 1 order by roomUpdatedAt desc"
        // );
        this.data = "roomUpdatedAt desc";
      }

      // unread
      if (this.props.showUnread) {
        this.getUnread(this.data);
        if (!this.unreadToken) {
          this.unreadToken = PubSub.subscribe("subscriptions", () =>
            this.getUnread(this.data)
          );
        }
      } else {
        this.removeListener(this.unreadToken);
      }
      // favorites
      if (this.props.showFavorites) {
        this.getFavorites(this.data);
        if (!this.favoritesToken) {
          this.favoritesToken = PubSub.subscribe("subscriptions", () =>
            this.getFavorites(this.data)
          );
        }
      } else {
        this.removeListener(this.favoritesToken);
      }
      // type
      if (this.props.groupByType) {
        this.getChannels(this.data);
        this.getPrivateGroup(this.data);
        this.getDirect(this.data);
        this.getLivechat(this.data);
        if (!this.groupByTypeToken) {
          this.groupByTypeToken = PubSub.subscribe("subscriptions", () => {
            // channels
            this.getChannels(this.data);

            // private
            this.getPrivateGroup(this.data);

            // direct
            this.getDirect(this.data);

            // livechat
            this.getLivechat(this.data);
          });
        }

        this.removeListener(this.chatsToken);
        this.removeListener(this.defaultToken);
      } else {
        // chats
        if (this.props.showUnread) {
          this.getChatsUnread(this.data);
          if (!this.chatsToken) {
            this.chatsToken = PubSub.subscribe("subscriptions", () =>
              this.getChatsUnread(this.data)
            );
          }
        } else {
          this.getChatsDefault(this.data);
          if (!this.defaultToken) {
            this.defaultToken = PubSub.subscribe("subscriptions", () =>
              this.getChatsDefault(this.data)
            );
          }
        }

        this.removeListener(this.groupByTypeToken);
      }
    }
    this.timeout = setTimeout(() => {
      this.setState({ loading: false });
    }, 200);
  };

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  initSearchingAndroid = () => {
    const { navigation } = this.props;
    navigation.setButtons({
      leftButtons: [
        {
          id: "cancelSearch",
          icon: { uri: "back", scale: Dimensions.get("window").scale }
        }
      ],
      rightButtons: []
    });
    navigation.setStyle({
      navBarCustomView: "RoomsListSearchView",
      navBarComponentAlignment: "fill"
    });
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
  };

  // this is necessary during development (enables Cmd + r)
  hasActiveDB = () => database && database.database; // && database.database.activeDB;

  cancelSearchingAndroid = () => {
    if (Platform.OS === "android") {
      this.setState({ search: [] });
      this.initDefaultHeader();
      Keyboard.dismiss();
      BackHandler.removeEventListener(
        "hardwareBackPress",
        this.handleBackPress
      );
    }
  };

  handleBackPress = () => {
    this.cancelSearchingAndroid();
    return true;
  };

  _isUnread = item => item.unread > 0 || item.alert;

  search = async text => {
    const result = await RocketChat.search({ text });
    this.setState({
      search: result
    });
  };

  goRoom = (rid, name) => {
    this.props.navigation.navigate("RoomView", {
      title: name,
      rid: rid
    });
    this.cancelSearchingAndroid();
  };

  _onPressItem = async (item = {}) => {
    if (!item.search) {
      const { rid, name } = item;
      return this.goRoom(rid, name);
    }
    if (item.t === "d") {
      // if user is using the search we need first to join/create room
      try {
        const { username } = item;
        const sub = await RocketChat.createDirectMessage(username);
        const { rid } = sub;
        return this.goRoom(rid, username);
      } catch (e) {
        log("RoomsListView._onPressItem", e);
      }
    } else {
      const { rid, name } = item;
      return this.goRoom(rid, name);
    }
  };

  toggleSort = () => {
    // database.objectstest();

    if (Platform.OS === "ios") {
      this.scroll.scrollTo({ x: 0, y: SCROLL_OFFSET, animated: true });
    } else {
      this.scroll.scrollTo({ x: 0, y: 0, animated: true });
    }
    setTimeout(() => {
      this.props.toggleSortDropdown();
    }, 100);
  };

  renderHeader = () => {
    if (this.state.search.length > 0) {
      return null;
    }
    return this.renderSort();
  };

  renderSort = () => {
    return (
      <Touch onPress={this.toggleSort} style={styles.dropdownContainerHeader}>
        <View style={styles.sortItemContainer}>
          <Text style={styles.sortToggleText}>
            {i18n.t("ran.chat.Sorting_by") +
              i18n.t(
                this.props.sortBy === "alphabetical"
                  ? "ran.chat.name"
                  : "ran.chat.activity"
              )}
          </Text>
          <Image style={styles.sortIcon} source={{ uri: "group_type" }} />
        </View>
      </Touch>
    );
  };

  renderSearchBar = () => {
    // if (Platform.OS === "ios") {}
    return (
      <SearchBox
        onChangeText={text => this.search(text)}
        testID="rooms-list-view-search"
      />
    );
  };

  renderItem = ({ item }) => {
    const id = item.rid.replace(this.props.userId, "").trim();
    const { useRealName } = this.props;
    return (
      <RoomItem
        alert={item.alert}
        unread={item.unread}
        userMentions={item.userMentions}
        favorite={item.f}
        lastMessage={item.lastMessage}
        name={(useRealName && item.fname) || item.name}
        _updatedAt={item.roomUpdatedAt}
        key={item._id}
        id={id}
        type={item.t}
        baseUrl={this.props.baseUrl}
        onPress={() => this._onPressItem(item)}
        testID={`rooms-list-view-item-${item.name}`}
        height={ROW_HEIGHT}
      />
    );
  };

  renderSeparator = () => <View style={styles.separator} />;

  renderSection = (data, header) => {
    if (header === "Unread" && !this.props.showUnread) {
      return null;
    } else if (header === "Favorites" && !this.props.showFavorites) {
      return null;
    } else if (
      ["Channels", "Direct_Messages", "Private_Groups", "Livechat"].includes(
        header
      ) &&
      !this.props.groupByType
    ) {
      return null;
    } else if (header === "Chats" && this.props.groupByType) {
      return null;
    }
    if (data.length > 0) {
      return (
        <FlatList
          data={data}
          extraData={data}
          keyExtractor={item => item.rid}
          style={styles.list}
          renderItem={this.renderItem}
          ItemSeparatorComponent={this.renderSeparator}
          ListHeaderComponent={() => (
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupTitle}>{header}</Text>
            </View>
          )}
          getItemLayout={getItemLayout}
          enableEmptySections
          removeClippedSubviews
          keyboardShouldPersistTaps="always"
        />
      );
    }
    return null;
  };

  renderList = () => {
    const {
      search,
      chats,
      unread,
      favorites,
      channels,
      direct,
      privateGroup,
      livechat
    } = this.state;

    if (search.length > 0) {
      return (
        <FlatList
          data={search}
          extraData={search}
          keyExtractor={item => item.rid}
          style={styles.list}
          renderItem={this.renderItem}
          ItemSeparatorComponent={this.renderSeparator}
          getItemLayout={getItemLayout}
          enableEmptySections
          removeClippedSubviews
          keyboardShouldPersistTaps="always"
        />
      );
    }

    return (
      <View style={styles.container}>
        {this.renderSection(unread, "Unread")}
        {this.renderSection(favorites, "Favorites")}
        {this.renderSection(channels, "Channels")}
        {this.renderSection(direct, "Direct_Messages")}
        {this.renderSection(privateGroup, "Private_Groups")}
        {this.renderSection(livechat, "Livechat")}
        {this.renderSection(chats, "Chats")}
      </View>
    );
  };

  renderScroll = () => {
    if (this.state.loading) {
      return <ActivityIndicator style={styles.loading} />;
    }

    return (
      <ScrollView
        ref={ref => (this.scroll = ref)}
        contentOffset={Platform.OS === "ios" ? { x: 0, y: SCROLL_OFFSET } : {}}
        keyboardShouldPersistTaps="always"
        testID="rooms-list-view-list"
      >
        {this.renderSearchBar()}
        {this.renderHeader()}
        {this.renderList()}
      </ScrollView>
    );
  };

  render = () => {
    console.log("render roomsListView");
    const {
      sortBy,
      groupByType,
      showFavorites,
      showUnread,
      showServerDropdown,
      showSortDropdown
    } = this.props;

    return (
      <View style={styles.container} testID="rooms-list-view">
        {this.renderScroll()}
        {showSortDropdown ? (
          <SortDropdown
            close={this.toggleSort}
            sortBy={sortBy}
            groupByType={groupByType}
            showFavorites={showFavorites}
            showUnread={showUnread}
          />
        ) : null}
        {showServerDropdown ? (
          <ServerDropdown navigation={this.props.navigation} />
        ) : null}
      </View>
    );
  };
}
