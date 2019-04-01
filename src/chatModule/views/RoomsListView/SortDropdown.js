import React, { Component } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  Image,
  TouchableWithoutFeedback
} from "react-native";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import i18n from "i18n-js";

import Touch from "../../utils/touch";
import styles from "./styles";
import RocketChat from "../../lib/rocketchat";
import { setPreference } from "../../actions/sortPreferences";
import log from "../../utils/log";
// import I18n from '../../i18n';

const ANIMATION_DURATION = 200;

@connect(
  state => ({
    closeSortDropdown: state.rooms.closeSortDropdown
  }),
  dispatch => ({
    setSortPreference: preference => dispatch(setPreference(preference))
  })
)
export default class Sort extends Component {
  static propTypes = {
    closeSortDropdown: PropTypes.bool,
    close: PropTypes.func,
    sortBy: PropTypes.string,
    groupByType: PropTypes.bool,
    showFavorites: PropTypes.bool,
    showUnread: PropTypes.bool,
    setSortPreference: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.animatedValue = new Animated.Value(0);
  }

  componentDidMount() {
    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.ease,
      useNativeDriver: true
    }).start();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.closeSortDropdown !== this.props.closeSortDropdown) {
      this.close();
    }
  }

  setSortPreference = async param => {
    try {
      this.props.setSortPreference(param);
      RocketChat.saveSortPreference(param);
    } catch (e) {
      log("RoomsListView.setSortPreference", e);
    }
  };

  sortByName = () => {
    this.setSortPreference({ sortBy: "alphabetical" });
    this.close();
  };

  sortByActivity = () => {
    this.setSortPreference({ sortBy: "activity" });
    this.close();
  };

  toggleGroupByType = () => {
    this.setSortPreference({ groupByType: !this.props.groupByType });
    this.close();
  };

  toggleGroupByFavorites = () => {
    this.setSortPreference({ showFavorites: !this.props.showFavorites });
    this.close();
  };

  toggleUnread = () => {
    this.setSortPreference({ showUnread: !this.props.showUnread });
    this.close();
  };

  close = () => {
    Animated.timing(this.animatedValue, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: Easing.ease,
      useNativeDriver: true
    }).start(() => this.props.close());
  };

  render() {
    const translateY = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-245, 41]
    });
    const backdropOpacity = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3]
    });
    const { sortBy, groupByType, showFavorites, showUnread } = this.props;
    return [
      <TouchableWithoutFeedback key="sort-backdrop" onPress={this.close}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>,
      <Animated.View
        key="sort-container"
        style={[styles.dropdownContainer, { transform: [{ translateY }] }]}
      >
        <Touch
          key="sort-alphabetical"
          style={styles.sortItemButton}
          onPress={this.sortByName}
        >
          <View style={styles.sortItemContainer}>
            <Image
              style={styles.sortIcon}
              source={{ uri: "sort_alphabetically" }}
            />
            <Text style={styles.sortItemText}>
              {i18n.t("ran.chat.Alphabetical")}
            </Text>
            {sortBy === "alphabetical" ? (
              <Image style={styles.sortIcon} source={{ uri: "check" }} />
            ) : null}
          </View>
        </Touch>
        <Touch
          key="sort-activity"
          style={styles.sortItemButton}
          onPress={this.sortByActivity}
        >
          <View style={styles.sortItemContainer}>
            <Image style={styles.sortIcon} source={{ uri: "sort_activity" }} />
            <Text style={styles.sortItemText}>
              {i18n.t("ran.chat.Activity")}
            </Text>
            {sortBy === "activity" ? (
              <Image style={styles.sortIcon} source={{ uri: "check" }} />
            ) : null}
          </View>
        </Touch>
        <View style={styles.sortSeparator} />
        <Touch
          key="group-type"
          style={styles.sortItemButton}
          onPress={this.toggleGroupByType}
        >
          <View style={styles.sortItemContainer}>
            <Image style={styles.sortIcon} source={{ uri: "group_type" }} />
            <Text style={styles.sortItemText}>
              {i18n.t("ran.chat.Group_by_type")}
            </Text>
            {groupByType ? (
              <Image style={styles.sortIcon} source={{ uri: "check" }} />
            ) : null}
          </View>
        </Touch>
        <Touch
          key="group-favorites"
          style={styles.sortItemButton}
          onPress={this.toggleGroupByFavorites}
        >
          <View style={styles.sortItemContainer}>
            <Image
              style={styles.sortIcon}
              source={{ uri: "group_favorites" }}
            />
            <Text style={styles.sortItemText}>
              {i18n.t("ran.chat.Group_by_favorites")}
            </Text>
            {showFavorites ? (
              <Image style={styles.sortIcon} source={{ uri: "check" }} />
            ) : null}
          </View>
        </Touch>
        <Touch
          key="group-unread"
          style={styles.sortItemButton}
          onPress={this.toggleUnread}
        >
          <View style={styles.sortItemContainer}>
            <Image style={styles.sortIcon} source={{ uri: "group_unread" }} />
            <Text style={styles.sortItemText}>
              {i18n.t("ran.chat.Unread_on_top")}
            </Text>
            {showUnread ? (
              <Image style={styles.sortIcon} source={{ uri: "check" }} />
            ) : null}
          </View>
        </Touch>
      </Animated.View>,
      <Touch
        key="sort-toggle"
        onPress={this.close}
        style={[
          styles.dropdownContainerHeader,
          styles.sortToggleContainerClose
        ]}
      >
        <View style={styles.sortItemContainer}>
          <Text style={styles.sortToggleText}>
            {i18n.t("ran.chat.Sorting_by")}
            {i18n.t(
              this.props.sortBy === "alphabetical"
                ? "ran.chat.name"
                : "ran.chat.activity"
            )}
          </Text>
          <Image style={styles.sortIcon} source={{ uri: "group_type" }} />
        </View>
      </Touch>
    ];
  }
}
