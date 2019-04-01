import React from "react";
import PropTypes from "prop-types";
import { FlatList, View, Text, SafeAreaView } from "react-native";
import { connect } from "react-redux";
import ActionSheet from "react-native-actionsheet";
import Icon from "@expo/vector-icons/Ionicons";
import i18n from "i18n-js";

import LoggedView from "../View";
import {
  openStarredMessages,
  closeStarredMessages
} from "../../actions/starredMessages";
import styles from "./styles";
import Message from "../../containers/message";
import { toggleStarRequest } from "../../actions/messages";
import RCActivityIndicator from "../../containers/ActivityIndicator";

const STAR_INDEX = 0;
const CANCEL_INDEX = 1;

@connect(
  state => ({
    messages: state.starredMessages.messages,
    ready: state.starredMessages.ready,
    user: {
      id: state.login.user && state.login.user.id,
      username: state.login.user && state.login.user.username,
      token: state.login.user && state.login.user.token
    }
  }),
  dispatch => ({
    openStarredMessages: (rid, limit) =>
      dispatch(openStarredMessages(rid, limit)),
    closeStarredMessages: () => dispatch(closeStarredMessages()),
    toggleStarRequest: message => dispatch(toggleStarRequest(message))
  })
)
/** @extends React.Component */
export default class StarredMessagesView extends LoggedView {
  static propTypes = {
    rid: PropTypes.string,
    messages: PropTypes.array,
    ready: PropTypes.bool,
    user: PropTypes.object,
    openStarredMessages: PropTypes.func,
    closeStarredMessages: PropTypes.func,
    toggleStarRequest: PropTypes.func
  };

  constructor(props) {
    super("StarredMessagesView", props);
    this.state = {
      message: {},
      loading: true,
      loadingMore: false
    };
  }

  static navigationOptions = props => {
    const { navigation } = props;
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
      )
    };
  };

  componentDidMount() {
    this.limit = 20;
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.ready && nextProps.ready !== this.props.ready) {
      this.setState({ loading: false, loadingMore: false });
    }
  }

  componentWillUnmount() {
    this.props.closeStarredMessages();
  }

  onLongPress = message => {
    this.setState({ message });
    if (this.actionSheet && this.actionSheet.show) {
      this.actionSheet.show();
    }
  };

  handleActionPress = actionIndex => {
    switch (actionIndex) {
      case STAR_INDEX:
        this.props.toggleStarRequest(this.state.message);
        break;
      default:
        break;
    }
  };

  load = () => {
    this.props.openStarredMessages(
      this.props.navigation.state.params.rid,
      this.limit
    );
  };

  moreData = () => {
    const { loadingMore } = this.state;
    const { messages } = this.props;
    if (messages.length < this.limit) {
      return;
    }
    if (!loadingMore) {
      this.setState({ loadingMore: true });
      this.limit += 20;
      this.load();
    }
  };

  renderEmpty = () => (
    <View style={styles.listEmptyContainer} testID="starred-messages-view">
      <Text>{i18n.t("ran.chat.No_starred_messages")}</Text>
    </View>
  );

  renderItem = ({ item }) => (
    <Message
      item={item}
      style={styles.message}
      reactions={item.reactions}
      user={this.props.user}
      customTimeFormat="MMMM Do YYYY, h:mm:ss a"
      onLongPress={this.onLongPress}
    />
  );

  render() {
    const { loading, loadingMore } = this.state;
    const { messages, ready } = this.props;

    const options = [i18n.t("ran.chat.Unstar"), i18n.t("ran.chat.Cancel")];

    if (ready && messages.length === 0) {
      return this.renderEmpty();
    }

    return (
      <SafeAreaView style={styles.list} testID="starred-messages-view">
        <FlatList
          data={messages}
          renderItem={this.renderItem}
          style={styles.list}
          keyExtractor={item => item._id}
          onEndReached={this.moreData}
          ListHeaderComponent={loading ? <RCActivityIndicator /> : null}
          ListFooterComponent={loadingMore ? <RCActivityIndicator /> : null}
        />
        <ActionSheet
          ref={o => (this.actionSheet = o)}
          title={i18n.t("ran.chat.Actions")}
          options={options}
          cancelButtonIndex={CANCEL_INDEX}
          onPress={this.handleActionPress}
        />
      </SafeAreaView>
    );
  }
}
