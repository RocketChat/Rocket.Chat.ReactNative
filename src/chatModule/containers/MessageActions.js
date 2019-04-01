import React from "react";
import PropTypes from "prop-types";
import { Alert, Clipboard, Vibration, Share } from "react-native";
import { connect } from "react-redux";
import ActionSheet from "react-native-actionsheet";
import * as moment from "moment";
import { compose, hoistStatics } from "recompose";
import i18n from "i18n-js";

import {
  deleteRequest,
  editInit,
  toggleStarRequest,
  togglePinRequest,
  actionsHide,
  toggleReactionPicker,
  replyInit
} from "../actions/messages";
import { showToast } from "../utils/info";
import RocketChat from "../lib/rocketchat";

@connect(
  state => ({
    actionMessage: state.messages.actionMessage,
    Message_AllowDeleting: state.settings.Message_AllowDeleting,
    Message_AllowDeleting_BlockDeleteInMinutes:
      state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
    Message_AllowEditing: state.settings.Message_AllowEditing,
    Message_AllowEditing_BlockEditInMinutes:
      state.settings.Message_AllowEditing_BlockEditInMinutes,
    Message_AllowPinning: state.settings.Message_AllowPinning,
    Message_AllowStarring: state.settings.Message_AllowStarring
  }),
  dispatch => ({
    actionsHide: () => dispatch(actionsHide()),
    deleteRequest: message => dispatch(deleteRequest(message)),
    editInit: message => dispatch(editInit(message)),
    toggleStarRequest: message => dispatch(toggleStarRequest(message)),
    togglePinRequest: message => dispatch(togglePinRequest(message)),
    toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
    replyInit: (message, mention) => dispatch(replyInit(message, mention))
  })
)
class MessageActions extends React.Component {
  static propTypes = {
    actionsHide: PropTypes.func.isRequired,
    room: PropTypes.object.isRequired,
    actionMessage: PropTypes.object,
    // user: PropTypes.object.isRequired,
    deleteRequest: PropTypes.func.isRequired,
    editInit: PropTypes.func.isRequired,
    toggleStarRequest: PropTypes.func.isRequired,
    togglePinRequest: PropTypes.func.isRequired,
    toggleReactionPicker: PropTypes.func.isRequired,
    replyInit: PropTypes.func.isRequired,
    Message_AllowDeleting: PropTypes.bool,
    Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
    Message_AllowEditing: PropTypes.bool,
    Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
    Message_AllowPinning: PropTypes.bool,
    Message_AllowStarring: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.handleActionPress = this.handleActionPress.bind(this);
    this.setPermissions();

    // Cancel
    this.options = [i18n.t("ran.chat.Cancel")];
    this.CANCEL_INDEX = 0;

    // Reply
    if (!this.isRoomReadOnly()) {
      this.options.push(i18n.t("ran.chat.Reply"));
      this.REPLY_INDEX = this.options.length - 1;
    }

    // Edit
    if (this.allowEdit(props)) {
      this.options.push(i18n.t("ran.chat.Edit"));
      this.EDIT_INDEX = this.options.length - 1;
    }

    // Permalink
    this.options.push(i18n.t("ran.chat.Copy_Permalink"));
    this.PERMALINK_INDEX = this.options.length - 1;

    // Copy
    this.options.push(i18n.t("ran.chat.Copy_Message"));
    this.COPY_INDEX = this.options.length - 1;

    // Share
    this.options.push(i18n.t("ran.chat.Share_Message"));
    this.SHARE_INDEX = this.options.length - 1;

    // Quote
    if (!this.isRoomReadOnly()) {
      this.options.push(i18n.t("ran.chat.Quote"));
      this.QUOTE_INDEX = this.options.length - 1;
    }

    // Star
    if (this.props.Message_AllowStarring) {
      this.options.push(
        props.actionMessage.starred
          ? i18n.t("ran.chat.Unstar")
          : i18n.t("ran.chat.Star")
      );
      this.STAR_INDEX = this.options.length - 1;
    }

    // Pin
    if (this.props.Message_AllowPinning) {
      this.options.push(
        props.actionMessage.pinned
          ? i18n.t("ran.chat.Unpin")
          : i18n.t("ran.chat.Pin")
      );
      this.PIN_INDEX = this.options.length - 1;
    }

    // Reaction
    if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
      this.options.push(i18n.t("ran.chat.Add_Reaction"));
      this.REACTION_INDEX = this.options.length - 1;
    }

    // Delete
    if (this.allowDelete(props)) {
      this.options.push(i18n.t("ran.chat.Delete"));
      this.DELETE_INDEX = this.options.length - 1;
    }
    setTimeout(() => {
      if (this.actionSheet && this.actionSheet.show) {
        this.actionSheet.show();
      }
      Vibration.vibrate(50);
    });
  }

  async setPermissions() {
    const permissions = [
      "edit-message",
      "delete-message",
      "force-delete-message"
    ];
    const result = await RocketChat.hasPermission(
      permissions,
      this.props.room.rid
    );
    this.hasEditPermission = result[permissions[0]];
    this.hasDeletePermission = result[permissions[1]];
    this.hasForceDeletePermission = result[permissions[2]];
  }

  getPermalink = async message => {
    try {
      return await RocketChat.getPermalink(message);
    } catch (error) {
      return null;
    }
  };

  isOwn = props =>
    props.actionMessage.u && props.actionMessage.u._id === props.user.id;

  isRoomReadOnly = () => this.props.room.ro;

  canReactWhenReadOnly = () => this.props.room.reactWhenReadOnly;

  allowEdit = props => {
    if (this.isRoomReadOnly()) {
      return false;
    }
    const editOwn = this.isOwn(props);
    const { Message_AllowEditing: isEditAllowed } = this.props;
    if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
      return false;
    }
    const blockEditInMinutes = this.props
      .Message_AllowEditing_BlockEditInMinutes;
    if (blockEditInMinutes) {
      let msgTs;
      if (props.actionMessage.ts != null) {
        msgTs = moment(props.actionMessage.ts);
      }
      let currentTsDiff;
      if (msgTs != null) {
        currentTsDiff = moment().diff(msgTs, "minutes");
      }
      return currentTsDiff < blockEditInMinutes;
    }
    return true;
  };

  allowDelete = props => {
    if (this.isRoomReadOnly()) {
      return false;
    }
    const deleteOwn = this.isOwn(props);
    const { Message_AllowDeleting: isDeleteAllowed } = this.props;
    if (
      !(
        this.hasDeletePermission ||
        (isDeleteAllowed && deleteOwn) ||
        this.hasForceDeletePermission
      )
    ) {
      return false;
    }
    if (this.hasForceDeletePermission) {
      return true;
    }
    const blockDeleteInMinutes = this.props
      .Message_AllowDeleting_BlockDeleteInMinutes;
    if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
      let msgTs;
      if (props.actionMessage.ts != null) {
        msgTs = moment(props.actionMessage.ts);
      }
      let currentTsDiff;
      if (msgTs != null) {
        currentTsDiff = moment().diff(msgTs, "minutes");
      }
      return currentTsDiff < blockDeleteInMinutes;
    }
    return true;
  };

  handleDelete() {
    Alert.alert(
      i18n.t("ran.chat.Are_you_sure_question_mark"),
      i18n.t("ran.chat.You_will_not_be_able_to_recover_this_message"),
      [
        {
          text: i18n.t("ran.chat.Cancel"),
          style: "cancel"
        },
        {
          text: i18n.t("ran.chat.Yes_delete_it"),
          style: "destructive",
          onPress: () => this.props.deleteRequest(this.props.actionMessage)
        }
      ],
      { cancelable: false }
    );
  }

  handleEdit() {
    const { _id, msg, rid } = this.props.actionMessage;
    this.props.editInit({ _id, msg, rid });
  }

  handleCopy = async () => {
    await Clipboard.setString(this.props.actionMessage.msg);
    showToast(i18n.t("ran.chat.Copied_to_clipboard"));
  };

  handleShare = async () => {
    Share.share({
      message: this.props.actionMessage.msg.replace(/<(?:.|\n)*?>/gm, "")
    });
  };

  handleStar() {
    this.props.toggleStarRequest(this.props.actionMessage);
  }

  async handlePermalink() {
    const permalink = await this.getPermalink(this.props.actionMessage);
    Clipboard.setString(permalink);
    showToast(i18n.t("ran.chat.Permalink_copied_to_clipboard"));
  }

  handlePin() {
    this.props.togglePinRequest(this.props.actionMessage);
  }

  handleReply() {
    this.props.replyInit(this.props.actionMessage, true);
  }

  handleQuote() {
    this.props.replyInit(this.props.actionMessage, false);
  }

  handleReaction() {
    this.props.toggleReactionPicker(this.props.actionMessage);
  }

  handleActionPress = actionIndex => {
    switch (actionIndex) {
      case this.REPLY_INDEX:
        this.handleReply();
        break;
      case this.EDIT_INDEX:
        this.handleEdit();
        break;
      case this.PERMALINK_INDEX:
        this.handlePermalink();
        break;
      case this.COPY_INDEX:
        this.handleCopy();
        break;
      case this.SHARE_INDEX:
        this.handleShare();
        break;
      case this.QUOTE_INDEX:
        this.handleQuote();
        break;
      case this.STAR_INDEX:
        this.handleStar();
        break;
      case this.PIN_INDEX:
        this.handlePin();
        break;
      case this.REACTION_INDEX:
        this.handleReaction();
        break;
      case this.DELETE_INDEX:
        this.handleDelete();
        break;
      default:
        break;
    }
    this.props.actionsHide();
  };

  render() {
    return (
      <ActionSheet
        ref={o => (this.actionSheet = o)}
        title={i18n.t("ran.chat.Message_actions")}
        testID="message-actions"
        options={this.options}
        cancelButtonIndex={this.CANCEL_INDEX}
        destructiveButtonIndex={this.DELETE_INDEX}
        onPress={this.handleActionPress}
      />
    );
  }
}

export default MessageActions;
