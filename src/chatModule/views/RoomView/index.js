import React from "react";
import PropTypes from "prop-types";
import {
  Text,
  View,
  LayoutAnimation,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";
import equal from "deep-equal";
import PubSub from "pubsub-js";
import { RectButton } from "react-native-gesture-handler";
import Icon from "@expo/vector-icons/Ionicons"; //ios-star-outline
import { NavigationActions } from "react-navigation";
import i18n from "i18n-js";

import LoggedView from "../View";
import { List } from "./ListView";
import { openRoom, closeRoom, setLastOpen } from "../../actions/room";
import { toggleReactionPicker, actionsShow } from "../../actions/messages";
import database from "../../../main/ran-db/sqlite";
import RocketChat from "../../lib/rocketchat";
import Message from "../../containers/message";
import MessageActions from "../../containers/MessageActions";
import MessageErrorActions from "../../containers/MessageErrorActions";
import MessageBox from "../../containers/MessageBox";
import ReactionPicker from "./ReactionPicker";
import UploadProgress from "./UploadProgress";
import styles from "./styles";
import log from "../../utils/log";
import debounce from "../../utils/debounce";

@connect(
  state => ({
    user: {
      id: state.login.user && state.login.user.id,
      username: state.login.user && state.login.user.username,
      token: state.login.user && state.login.user.token
    },
    actionMessage: state.messages.actionMessage,
    showActions: state.messages.showActions,
    showErrorActions: state.messages.showErrorActions
  }),
  dispatch => ({
    openRoom: room => dispatch(openRoom(room)),
    setLastOpen: date => dispatch(setLastOpen(date)),
    toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
    actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
    close: () => dispatch(closeRoom())
  })
)
/** @extends React.Component */
export default class RoomView extends LoggedView {
  static propTypes = {
    navigator: PropTypes.object,
    openRoom: PropTypes.func.isRequired,
    setLastOpen: PropTypes.func.isRequired,
    user: PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      token: PropTypes.string.isRequired
    }),
    rid: PropTypes.string,
    showActions: PropTypes.bool,
    showErrorActions: PropTypes.bool,
    actionMessage: PropTypes.object,
    toggleReactionPicker: PropTypes.func.isRequired,
    actionsShow: PropTypes.func,
    close: PropTypes.func
  };

  constructor(props) {
    super("RoomView", props);
    this.rid = this.props.navigation.state.params.rid;
    this.rooms = null;
    this.roomsToken = null;
    this.state = {
      loaded: false,
      joined: false,
      room: {},
      end: false
    };
    this.onReactionPress = this.onReactionPress.bind(this);
  }

  static navigationOptions = props => {
    const { navigation, screenProps } = props;
    return {
      title: navigation.getParam("title"),
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
            disabled={navigation.state.params.toggleFavoriteDisabled}
            onPress={() => {
              navigation.state.params.toggleFavorite();
            }}
          >
            <Icon
              name={
                navigation.state.params.favorite
                  ? "ios-star"
                  : "ios-star-outline"
              }
              size={22}
              color="#4674F1"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginHorizontal: 15 }}
            onPress={() => {
              navigation.navigate("RoomActionsView", {
                title: i18n.t("ran.chat.Actions"),
                rid: navigation.state.params.rid
              });
            }}
          >
            <Icon name="ios-more" size={22} color="#4674F1" />
          </TouchableOpacity>
        </View>
      )
    };
  };

  componentWillMount() {
    this.props.navigation.setParams({
      toggleFavorite: this._toggleFavorite,
      toggleFavoriteDisabled: false
      // favorite: this.state.room.f
    });
  }

  async componentDidMount() {
    this.updateRoom();

    if (!this.roomsToken) {
      this.roomsToken = PubSub.subscribe("subscriptions", this.updateRoom);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(
      equal(this.props, nextProps) &&
      equal(this.state, nextState) &&
      this.state.room.ro === nextState.room.ro
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.room.f !== this.state.room.f) {
      this.props.navigation.setParams({
        favorite: this.state.room.f
      });
    }
  }

  setNavigationActions = actions => {
    const setParamsAction = NavigationActions.setParams({
      ...actions
    });
    this.props.navigation.dispatch(setParamsAction);
  };

  _toggleFavorite = () => {
    this.props.navigation.setParams({
      toggleFavoriteDisabled: true
    });
    try {
      RocketChat.toggleFavorite(this.state.room.rid, this.state.room.f).then(
        ret => {
          if (ret) {
            // success: ret = 1
            this.setNavigationActions({
              params: {
                favorite: !this.state.room.f
              },
              key: this.props.navigation.state.key
            });
          } else {
          }
          this.props.navigation.setParams({
            toggleFavoriteDisabled: false
          });
        }
      );
    } catch (e) {
      log("toggleFavorite", e);
      this.props.navigation.setParams({
        toggleFavoriteDisabled: false
      });
    }
  };

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  componentWillUnmount() {
    this.removeListener(this.roomsToken);
    this.onEndReached.stop();
    this.props.close();
  }

  onNavigatorEvent(event) {
    if (event.type === "NavBarButtonPress") {
      if (event.id === "more") {
        this.props.navigator.push({
          screen: "RoomActionsView",
          title: i18n.t("ran.chat.Actions"),
          backButtonTitle: "",
          passProps: {
            rid: this.state.room.rid
          }
        });
      } else if (event.id === "star") {
        try {
          RocketChat.toggleFavorite(this.state.room.rid, this.state.room.f);
        } catch (e) {
          log("toggleFavorite", e);
        }
      }
    }
  }

  onEndReached = debounce(lastRowData => {
    if (!lastRowData) {
      this.setState({ end: true });
      return;
    }

    requestAnimationFrame(async () => {
      try {
        const result = await RocketChat.loadMessagesForRoom({
          rid: this.rid,
          t: this.state.room.t,
          latest: lastRowData.ts
        });
        this.setState({ end: result ? result.length < 20 : true });
      } catch (e) {
        log("RoomView.onEndReached", e);
      }
    });
  });

  onMessageLongPress = message => {
    this.props.actionsShow(message);
  };

  onReactionPress = (shortname, messageId) => {
    console.log("onReactionPress");

    try {
      if (!messageId) {
        RocketChat.setReaction(shortname, this.props.actionMessage._id);
        return this.props.toggleReactionPicker();
      }
      RocketChat.setReaction(shortname, messageId);
    } catch (e) {
      log("RoomView.onReactionPress", e);
    }
  };

  updateRoom = async () => {
    this.rooms = await database.objects(
      "subscriptions",
      `WHERE rid="${this.rid}"`
    );
    if (this.rooms.length > 0) {
      const { room: prevRoom } = this.state;
      const room = JSON.parse(JSON.stringify(this.rooms[0]));
      this.setState({
        joined: this.rooms.length > 0,
        loaded: true,
        room: room
      });

      if (!prevRoom.rid) {
        // this.props.navigator.setTitle({ title: room.name });
        this.props.openRoom({
          ...room
        });
        if (room.alert || room.unread || room.userMentions) {
          this.props.setLastOpen(room.ls);
        } else {
          this.props.setLastOpen(null);
        }
      }
    } else {
      this.props.openRoom({ rid: this.rid });
      this.setState({ joined: false });
    }
  };

  sendMessage = message => {
    LayoutAnimation.easeInEaseOut();
    RocketChat.sendMessage(this.rid, message).then(() => {
      this.props.setLastOpen(null);
    });
  };

  joinRoom = async () => {
    try {
      await RocketChat.joinRoom(this.props.rid);
      this.setState({ joined: true });
    } catch (e) {
      log("joinRoom", e);
    }
  };

  isOwner = () =>
    this.state.room &&
    this.state.room.roles &&
    Array.from(
      Object.keys(this.state.room.roles),
      i => this.state.room.roles[i].value
    ).includes("owner");

  isMuted = () =>
    this.state.room &&
    this.state.room.muted &&
    Array.from(
      Object.keys(this.state.room.muted),
      i => this.state.room.muted[i].value
    ).includes(this.props.user.username);

  isReadOnly = () => this.state.room.ro && this.isMuted() && !this.isOwner();

  isBlocked = () => {
    if (this.state.room) {
      const { t, blocked, blocker } = this.state.room;
      if (t === "d" && (blocked || blocker)) {
        return true;
      }
    }
    return false;
  };

  renderItem = (item, previousItem) => (
    <Message
      key={item._id}
      item={item}
      status={item.status}
      reactions={JSON.parse(item.reactions)}
      user={this.props.user}
      archived={this.state.room.archived}
      broadcast={this.state.room.broadcast ? true : false}
      previousItem={previousItem}
      _updatedAt={new Date(item._updatedAt)}
      onReactionPress={this.onReactionPress}
      onLongPress={this.onMessageLongPress}
      customTimeFormat="MMMM Do YYYY, h:mm:ss a"
    />
  );

  renderFooter = () => {
    if (!this.state.joined) {
      return (
        <View style={styles.joinRoomContainer} key="room-view-join">
          <Text style={styles.previewMode}>
            {i18n.t("ran.chat.You_are_in_preview_mode")}
          </Text>
          <RectButton
            onPress={this.joinRoom}
            style={styles.joinRoomButton}
            activeOpacity={0.5}
            underlayColor="#fff"
          >
            <Text style={styles.joinRoomText}>{i18n.t("ran.chat.Join")}</Text>
          </RectButton>
        </View>
      );
    }
    if (this.state.room.archived || this.isReadOnly()) {
      return (
        <View style={styles.readOnly}>
          <Text>{i18n.t("ran.chat.This_room_is_read_only")}</Text>
        </View>
      );
    }
    if (this.isBlocked()) {
      return (
        <View style={styles.blockedOrBlocker}>
          <Text>{i18n.t("ran.chat.This_room_is_blocked")}</Text>
        </View>
      );
    }
    return (
      <MessageBox
        key="room-view-messagebox"
        onSubmit={this.sendMessage}
        rid={this.rid}
      />
    );
  };

  renderHeader = () => {
    if (!this.state.loaded && !this.state.end) {
      return (
        <ActivityIndicator
          style={[styles.loading, { transform: [{ scaleY: -1 }] }]}
        />
      );
    }
    return null;
  };

  renderList = () => {
    if (!this.state.loaded) {
      return <ActivityIndicator style={styles.loading} />;
    }
    return [
      <List
        key="room-view-messages"
        end={this.state.end}
        room={this.rid}
        renderFooter={this.renderHeader}
        onEndReached={this.onEndReached}
        renderRow={this.renderItem}
      />,
      this.renderFooter()
    ];
  };

  render() {
    console.log("render RoomView");
    console.log(this.state.room);

    return (
      <SafeAreaView style={styles.container} testID="room-view">
        {this.renderList()}
        {this.state.room._id && this.props.showActions ? (
          <MessageActions room={this.state.room} user={this.props.user} />
        ) : null}
        {this.props.showErrorActions ? <MessageErrorActions /> : null}
        <ReactionPicker onEmojiSelected={this.onReactionPress} />
        <UploadProgress rid={this.rid} />
      </SafeAreaView>
    );
  }
}
