import React from "react";
import PropTypes from "prop-types";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  Alert
} from "react-native";
import { connect } from "react-redux";
import Icon from "@expo/vector-icons/Ionicons";
import PubSub from "pubsub-js";
import i18n from "i18n-js";

import LoggedView from "../View";
import KeyboardView from "../../presentation/KeyboardView";
import sharedStyles from "../Styles";
import styles from "./styles";
import scrollPersistTaps from "../../utils/scrollPersistTaps";
import { showErrorAlert, showToast } from "../../utils/info";
import database from "../../../main/ran-db/sqlite";
import RocketChat from "../../lib/rocketchat";
import { eraseRoom } from "../../actions/room";
import RCTextInput from "../../containers/TextInput";
import Loading from "../../containers/Loading";
import SwitchContainer from "./SwitchContainer";
import random from "../../utils/random";
import log from "../../utils/log";

const PERMISSION_SET_READONLY = "set-readonly";
const PERMISSION_SET_REACT_WHEN_READONLY = "set-react-when-readonly";
const PERMISSION_ARCHIVE = "archive-room";
const PERMISSION_UNARCHIVE = "unarchive-room";
const PERMISSION_DELETE_C = "delete-c";
const PERMISSION_DELETE_P = "delete-p";
const PERMISSIONS_ARRAY = [
  PERMISSION_SET_READONLY,
  PERMISSION_SET_REACT_WHEN_READONLY,
  PERMISSION_ARCHIVE,
  PERMISSION_UNARCHIVE,
  PERMISSION_DELETE_C,
  PERMISSION_DELETE_P
];

@connect(
  null,
  dispatch => ({
    eraseRoom: rid => dispatch(eraseRoom(rid))
  })
)
/** @extends React.Component */
export default class RoomInfoEditView extends LoggedView {
  static propTypes = {
    rid: PropTypes.string,
    eraseRoom: PropTypes.func
  };

  constructor(props) {
    super("RoomInfoEditView", props);
    this.rooms = [];
    this.roomsToken = null;
    this.permissions = {};
    this.state = {
      room: {},
      name: "",
      description: "",
      topic: "",
      announcement: "",
      joinCode: "",
      nameError: {},
      saving: false,
      t: false,
      ro: false,
      reactWhenReadOnly: false
    };
  }

  static navigationOptions = props => {
    const { navigation, screenProps } = props;
    return {
      title: navigation.state.params.title,
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
    this.init();
    if (!this.roomsToken) {
      this.roomsToken = PubSub.subscribe("subscriptions", this.updateRoom);
    }
    this.permissions = RocketChat.hasPermission(
      PERMISSIONS_ARRAY,
      this.state.room.rid
    );
  }

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  componentWillUnmount() {
    this.removeListener(this.roomsToken);
  }

  updateRoom = async () => {
    this.rooms = await database.objects(
      "subscriptions",
      `WHERE rid ="${this.props.navigation.state.params.rid}"`
    );
    const [room] = this.rooms;
    await this.setState({ room });
  };

  init = () => {
    const {
      name,
      description,
      topic,
      announcement,
      t,
      ro,
      reactWhenReadOnly,
      joinCodeRequired
    } = this.state.room;
    // fake password just to user knows about it
    this.randomValue = random(15);
    this.setState({
      name,
      description,
      topic,
      announcement,
      t: t === "p",
      ro,
      reactWhenReadOnly,
      joinCode: joinCodeRequired ? this.randomValue : ""
    });
  };

  clearErrors = () => {
    this.setState({
      nameError: {}
    });
  };

  reset = () => {
    this.clearErrors();
    this.init();
  };

  formIsChanged = () => {
    const {
      room,
      name,
      description,
      topic,
      announcement,
      t,
      ro,
      reactWhenReadOnly,
      joinCode
    } = this.state;
    return !(
      room.name === name &&
      room.description === description &&
      room.topic === topic &&
      room.announcement === announcement &&
      this.randomValue === joinCode &&
      (room.t === "p") === t &&
      room.ro === ro &&
      room.reactWhenReadOnly === reactWhenReadOnly
    );
  };

  submit = async () => {
    Keyboard.dismiss();
    const {
      room,
      name,
      description,
      topic,
      announcement,
      t,
      ro,
      reactWhenReadOnly,
      joinCode
    } = this.state;

    this.setState({ saving: true });
    let error = false;

    if (!this.formIsChanged()) {
      showErrorAlert(i18n.t("ran.chat.Nothing_to_save"));
      return;
    }

    // Clear error objects
    await this.clearErrors();

    const params = {};

    // Name
    if (room.name !== name) {
      params.roomName = name;
    }
    // Description
    if (room.description !== description) {
      params.roomDescription = description;
    }
    // Topic
    if (room.topic !== topic) {
      params.roomTopic = topic;
    }
    // Announcement
    if (room.announcement !== announcement) {
      params.roomAnnouncement = announcement;
    }
    // Room Type
    if (room.t !== t) {
      params.roomType = t ? "p" : "c";
    }
    // Read Only
    if (room.ro !== ro) {
      params.readOnly = ro;
    }
    // React When Read Only
    if (room.reactWhenReadOnly !== reactWhenReadOnly) {
      params.reactWhenReadOnly = reactWhenReadOnly;
    }

    // Join Code
    if (this.randomValue !== joinCode) {
      params.joinCode = joinCode;
    }

    try {
      await RocketChat.saveRoomSettings(room.rid, params);
    } catch (e) {
      if (e.error === "error-invalid-room-name") {
        this.setState({ nameError: e });
      }
      error = true;
      log("saveRoomSettings", e);
    }

    await this.setState({ saving: false });
    setTimeout(() => {
      if (error) {
        showErrorAlert(
          i18n.t("ran.chat.There_was_an_error_while_saving_settings_action")
        );
      } else {
        showToast(i18n.t("ran.chat.Settings_succesfully_changed"));
      }
    }, 100);
  };

  delete = () => {
    Alert.alert(
      i18n.t("ran.chat.Are_you_sure_question_mark"),
      i18n.t("ran.chat.Delete_Room_Warning"),
      [
        {
          text: i18n.t("ran.chat.Cancel"),
          style: "cancel"
        },
        {
          text: i18n.t("ran.chat.Yes_action_delete_it"),
          style: "destructive",
          onPress: () => this.props.eraseRoom(this.state.room.rid)
        }
      ],
      { cancelable: false }
    );
  };

  toggleArchive = () => {
    const { archived } = this.state.room;
    const action = i18n.t(`ran.chat.${archived ? "un" : ""}archive`);
    Alert.alert(
      i18n.t("ran.chat.Are_you_sure_question_mark"),
      i18n.t(
        `ran.chat.Do_you_really_want_to_${action}_this_room_question_mark`
      ),
      [
        {
          text: i18n.t("ran.chat.Cancel"),
          style: "cancel"
        },
        {
          text: i18n.t(`ran.chat.Yes_action_${action}_it`),
          style: "destructive",
          onPress: () => {
            try {
              RocketChat.toggleArchiveRoom(this.state.room.rid, !archived);
            } catch (e) {
              log("toggleArchive", e);
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  hasDeletePermission = () =>
    this.state.room.t === "p"
      ? this.permissions[PERMISSION_DELETE_P]
      : this.permissions[PERMISSION_DELETE_C];

  hasArchivePermission = () =>
    this.permissions[PERMISSION_ARCHIVE] ||
    this.permissions[PERMISSION_UNARCHIVE];

  render() {
    const {
      name,
      nameError,
      description,
      topic,
      announcement,
      t,
      ro,
      reactWhenReadOnly,
      room,
      joinCode
    } = this.state;
    if (!room) {
      room = {};
    }
    return (
      <KeyboardView
        contentContainerStyle={sharedStyles.container}
        keyboardVerticalOffset={128}
      >
        <ScrollView
          contentContainerStyle={sharedStyles.containerScrollView}
          testID="room-info-edit-view-list"
          {...scrollPersistTaps}
        >
          <SafeAreaView
            style={sharedStyles.container}
            testID="room-info-edit-view"
          >
            <RCTextInput
              inputRef={e => {
                this.name = e;
              }}
              label={i18n.t("ran.chat.Name")}
              value={name}
              onChangeText={value => this.setState({ name: value })}
              onSubmitEditing={() => {
                this.description.focus();
              }}
              error={nameError}
              testID="room-info-edit-view-name"
            />
            <RCTextInput
              inputRef={e => {
                this.description = e;
              }}
              label={i18n.t("ran.chat.Description")}
              value={description}
              onChangeText={value => this.setState({ description: value })}
              onSubmitEditing={() => {
                this.topic.focus();
              }}
              testID="room-info-edit-view-description"
            />
            <RCTextInput
              inputRef={e => {
                this.topic = e;
              }}
              label={i18n.t("ran.chat.Topic")}
              value={topic}
              onChangeText={value => this.setState({ topic: value })}
              onSubmitEditing={() => {
                this.announcement.focus();
              }}
              testID="room-info-edit-view-topic"
            />
            <RCTextInput
              inputRef={e => {
                this.announcement = e;
              }}
              label={i18n.t("ran.chat.Announcement")}
              value={announcement}
              onChangeText={value => this.setState({ announcement: value })}
              onSubmitEditing={() => {
                this.joinCode.focus();
              }}
              testID="room-info-edit-view-announcement"
            />
            <RCTextInput
              inputRef={e => {
                this.joinCode = e;
              }}
              label={i18n.t("ran.chat.Password")}
              value={joinCode}
              onChangeText={value => this.setState({ joinCode: value })}
              onSubmitEditing={this.submit}
              secureTextEntry
              testID="room-info-edit-view-password"
            />
            <SwitchContainer
              value={t ? true : false}
              leftLabelPrimary={i18n.t("ran.chat.Public")}
              leftLabelSecondary={i18n.t(
                "ran.chat.Everyone_can_access_this_channel"
              )}
              rightLabelPrimary={i18n.t("ran.chat.Private")}
              rightLabelSecondary={i18n.t(
                "ran.chat.Just_invited_people_can_access_this_channel"
              )}
              onValueChange={value => this.setState({ t: value })}
              testID="room-info-edit-view-t"
            />
            <SwitchContainer
              value={ro ? true : false}
              leftLabelPrimary={i18n.t("ran.chat.Colaborative")}
              leftLabelSecondary={i18n.t(
                "ran.chat.All_users_in_the_channel_can_write_new_messages"
              )}
              rightLabelPrimary={i18n.t("ran.chat.Read_Only")}
              rightLabelSecondary={i18n.t(
                "ran.chat.Only_authorized_users_can_write_new_messages"
              )}
              onValueChange={value => this.setState({ ro: value })}
              disabled={
                !this.permissions[PERMISSION_SET_READONLY] || room.broadcast
              }
              testID="room-info-edit-view-ro"
            />
            {ro && !room.broadcast ? (
              <SwitchContainer
                value={reactWhenReadOnly ? true : false}
                leftLabelPrimary={i18n.t("ran.chat.No_Reactions")}
                leftLabelSecondary={i18n.t("ran.chat.Reactions_are_disabled")}
                rightLabelPrimary={i18n.t("ran.chat.Allow_Reactions")}
                rightLabelSecondary={i18n.t("ran.chat.Reactions_are_enabled")}
                onValueChange={value =>
                  this.setState({ reactWhenReadOnly: value })
                }
                disabled={!this.permissions[PERMISSION_SET_REACT_WHEN_READONLY]}
                testID="room-info-edit-view-react-when-ro"
              />
            ) : null}
            {room.broadcast
              ? [
                  <Text style={styles.broadcast}>
                    {i18n.t("ran.chat.Broadcast_Channel")}
                  </Text>,
                  <View style={styles.divider} />
                ]
              : null}
            <TouchableOpacity
              style={[
                sharedStyles.buttonContainer,
                !this.formIsChanged() && styles.buttonContainerDisabled
              ]}
              onPress={this.submit}
              disabled={!this.formIsChanged()}
              testID="room-info-edit-view-submit"
            >
              <Text style={sharedStyles.button} accessibilityTraits="button">
                {i18n.t("ran.chat.SAVE")}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={[
                  sharedStyles.buttonContainer_inverted,
                  styles.buttonInverted,
                  { flex: 1 }
                ]}
                onPress={this.reset}
                testID="room-info-edit-view-reset"
              >
                <Text
                  style={sharedStyles.button_inverted}
                  accessibilityTraits="button"
                >
                  {i18n.t("ran.chat.RESET")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sharedStyles.buttonContainer_inverted,
                  styles.buttonDanger,
                  !this.hasArchivePermission() && sharedStyles.opacity5,
                  { flex: 1, marginLeft: 10 }
                ]}
                onPress={this.toggleArchive}
                disabled={!this.hasArchivePermission()}
                testID="room-info-edit-view-archive"
              >
                <Text
                  style={[sharedStyles.button_inverted, styles.colorDanger]}
                  accessibilityTraits="button"
                >
                  {room.archived
                    ? i18n.t("ran.chat.UNARCHIVE")
                    : i18n.t("ran.chat.ARCHIVE")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[
                sharedStyles.buttonContainer_inverted,
                sharedStyles.buttonContainerLastChild,
                styles.buttonDanger,
                !this.hasDeletePermission() && sharedStyles.opacity5
              ]}
              onPress={this.delete}
              disabled={!this.hasDeletePermission()}
              testID="room-info-edit-view-delete"
            >
              <Text
                style={[sharedStyles.button_inverted, styles.colorDanger]}
                accessibilityTraits="button"
              >
                {i18n.t("ran.chat.DELETE")}
              </Text>
            </TouchableOpacity>
            <Loading visible={this.state.saving} />
          </SafeAreaView>
        </ScrollView>
      </KeyboardView>
    );
  }
}
