import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { connect } from "react-redux";
import { emojify } from "react-emojione";
import i18n from "i18n-js";

import Avatar from "../containers/Avatar";
import Status from "../containers/status";
import Touch from "../utils/touch/index"; //eslint-disable-line
import RoomTypeIcon from "../containers/RoomTypeIcon";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center"
  },
  centerContainer: {
    flex: 1,
    height: "100%",
    marginRight: 4
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: "#0C0D0F",
    fontWeight: "400",
    marginRight: 5,
    paddingTop: 0,
    paddingBottom: 0
  },
  alert: {
    fontWeight: "600"
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start"
  },
  titleContainer: {
    width: "100%",
    marginTop: Platform.OS === "ios" ? 5 : 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  date: {
    fontSize: 14,
    color: "#9EA2A8",
    fontWeight: "normal",
    paddingTop: 0,
    paddingBottom: 0
  },
  updateAlert: {
    color: "#1D74F5"
  },
  unreadNumberContainer: {
    minWidth: 23,
    padding: 3,
    borderRadius: 4,
    backgroundColor: "#1D74F5",
    alignItems: "center",
    justifyContent: "center"
  },
  unreadNumberText: {
    color: "#fff",
    overflow: "hidden",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.56
  },
  status: {
    borderRadius: 10,
    width: 10,
    height: 10,
    marginRight: 7,
    marginTop: 3
  },
  disclosureContainer: {
    height: "100%",
    marginLeft: 6,
    marginRight: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  disclosureIndicator: {
    width: 20,
    height: 20
  },
  emptyDisclosureAndroid: {
    width: 15
  },
  markdownText: {
    flex: 1,
    color: "#9EA2A8",
    fontSize: 15,
    fontWeight: "normal"
  }
});

const renderNumber = (unread, userMentions) => {
  if (!unread || unread <= 0) {
    return;
  }

  if (unread >= 1000) {
    unread = "999+";
  }

  if (userMentions > 0) {
    unread = `@ ${unread}`;
  }

  return (
    <View style={styles.unreadNumberContainer}>
      <Text style={styles.unreadNumberText}>{unread}</Text>
    </View>
  );
};

const attrs = [
  "name",
  "unread",
  "userMentions",
  "alert",
  "showLastMessage",
  "type"
];

@connect(state => ({
  username: state.login.user && state.login.user.username,
  StoreLastMessage: state.settings.Store_Last_Message,
  baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
}))
export default class RoomItem extends React.Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    baseUrl: PropTypes.string.isRequired,
    StoreLastMessage: PropTypes.bool,
    _updatedAt: PropTypes.string,
    lastMessage: PropTypes.string,
    showLastMessage: PropTypes.bool,
    favorite: PropTypes.number,
    alert: PropTypes.number,
    unread: PropTypes.number,
    userMentions: PropTypes.number,
    id: PropTypes.string,
    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    username: PropTypes.string,
    avatarSize: PropTypes.number,
    testID: PropTypes.string,
    height: PropTypes.number
  };

  static defaultProps = {
    showLastMessage: true,
    avatarSize: 48
  };
  shouldComponentUpdate(nextProps) {
    const oldlastMessage = JSON.parse(this.props.lastMessage);
    const newLastmessage = JSON.parse(nextProps.lastMessage);

    if (
      oldlastMessage &&
      newLastmessage &&
      oldlastMessage.ts !== newLastmessage.ts
    ) {
      return true;
    }
    if (
      this.props._updatedAt &&
      nextProps._updatedAt &&
      nextProps._updatedAt !== this.props._updatedAt
    ) {
      return true;
    }
    return attrs.some(key => nextProps[key] !== this.props[key]);
  }
  get avatar() {
    const { type, name, avatarSize, baseUrl } = this.props;
    return (
      <Avatar
        text={name}
        size={avatarSize}
        type={type}
        baseUrl={baseUrl}
        style={{ marginHorizontal: 15 }}
      />
    );
  }

  get lastMessage() {
    const { lastMessage, type, showLastMessage } = this.props;

    let lastMessageObject = lastMessage ? JSON.parse(lastMessage) : null;

    if (!this.props.StoreLastMessage || !showLastMessage) {
      return "";
    }
    if (!lastMessageObject) {
      return i18n.t("ran.chat.No_Message");
    }

    let prefix = "";

    if (lastMessageObject.u.username === this.props.username) {
      prefix = i18n.t("ran.chat.You_colon");
    } else if (type !== "d") {
      prefix = `${lastMessageObject.u.username}: `;
    }

    let msg = `${prefix}${lastMessageObject.msg.replace(/[\n\t\r]/gim, "")}`;
    msg = emojify(msg, { output: "unicode" });
    return msg;
  }

  get type() {
    const { type, id } = this.props;
    if (type === "d") {
      return <Status style={[styles.status]} id={id} />;
    }
    return <RoomTypeIcon type={type} />;
  }

  formatDate = date =>
    moment(date, "YYYY-MM-DDTHH:mm:ss.SSS").calendar(null, {
      // "ddd MMM DD YYYY HH:mm:ss"
      lastDay: `[${"Yesterday"}]`,
      sameDay: "h:mm A",
      lastWeek: "dddd",
      sameElse: "MMM D"
    });

  renderDisclosureIndicator = () => {
    if (Platform.OS === "ios") {
      return (
        <View style={styles.disclosureContainer}>
          <Image
            source={{ uri: "disclosure_indicator" }}
            style={styles.disclosureIndicator}
          />
        </View>
      );
    }
    return <View style={styles.emptyDisclosureAndroid} />;
  };

  render() {
    const {
      favorite,
      unread,
      userMentions,
      name,
      _updatedAt,
      alert,
      testID,
      height
    } = this.props;

    const date = this.formatDate(_updatedAt);

    let accessibilityLabel = name;
    if (unread === 1) {
      accessibilityLabel += `, ${unread} ${i18n.t("ran.chat.alert")}`;
    } else if (unread > 1) {
      accessibilityLabel += `, ${unread} ${i18n.t("ran.chat.alerts")}`;
    }

    if (userMentions > 0) {
      accessibilityLabel += `, ${i18n.t("ran.chat.you_were_mentioned")}`;
    }

    if (date) {
      accessibilityLabel += `, ${i18n.t("ran.chat.last_message")} ${date}`;
    }

    return (
      <Touch
        onPress={this.props.onPress}
        onLongPress={this.props.onLongPress}
        underlayColor="#FFFFFF"
        activeOpacity={0.5}
        accessibilityLabel={accessibilityLabel}
        accessibilityTraits="selected"
        testID={testID}
      >
        <View
          style={[
            styles.container,
            favorite && styles.favorite,
            height && { height }
          ]}
        >
          {this.avatar}
          <View style={styles.centerContainer}>
            <View style={styles.titleContainer}>
              {this.type}
              <Text
                style={[styles.title, alert && styles.alert]}
                ellipsizeMode="tail"
                numberOfLines={1}
              >
                {name}
              </Text>
              {_updatedAt ? (
                <Text
                  style={[styles.date, alert && styles.updateAlert]}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {date}
                </Text>
              ) : null}
            </View>
            <View style={styles.row}>
              <Text style={styles.markdownText} numberOfLines={2}>
                {this.lastMessage}
              </Text>
              {renderNumber(unread, userMentions)}
            </View>
          </View>
          {this.renderDisclosureIndicator()}
        </View>
      </Touch>
    );
  }
}
