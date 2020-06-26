import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View, Alert, Keyboard, StyleSheet, TouchableOpacity, SafeAreaView, BackHandler
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';
import DocumentPicker from 'react-native-document-picker';
import { Q } from '@nozbe/watermelondb';
import Animated from 'react-native-reanimated';

import { withTheme } from '../../theme';
import sharedStyles from './../Styles';
import { generateTriggerId } from '../../lib/methods/actions';
import TextInput from '../../presentation/TextInput';
import { userTyping as userTypingAction } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import { emojis } from '../../emojis';
import Recording from '../../containers/MessageBox/Recording';
import UploadModal from '../../containers/MessageBox/UploadModal';
import log from '../../utils/log';
import I18n from '../../i18n';
import ReplyPreview from '../../containers/MessageBox/ReplyPreview';
import debounce from '../../utils/debounce';
import { themes } from '../../constants/colors';
import LeftButtons from '../../containers/MessageBox/LeftButtons';
import RightButtons from '../../containers/MessageBox/RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import { canUploadFile } from '../../utils/media';
import EventEmiter from '../../utils/events';
import {
  KEY_COMMAND,
  handleCommandTyping,
  handleCommandSubmit,
  handleCommandShowUpload
} from '../../commands';
import Mentions from '../../containers/MessageBox/Mentions';
import MessageboxContext from '../../containers/MessageBox/Context';
import {
  MENTIONS_TRACKING_TYPE_EMOJIS,
  MENTIONS_TRACKING_TYPE_COMMANDS,
  MENTIONS_COUNT_TO_DISPLAY,
  MENTIONS_TRACKING_TYPE_USERS
} from '../../containers/MessageBox/constants';
import CommandsPreview from '../../containers/MessageBox/CommandsPreview';
import { Review } from '../../utils/review';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/Navigation';
import { CustomIcon } from '../../lib/Icons';
import { withActionSheet } from '../../containers/ActionSheet';

const stylez = StyleSheet.create({
  input: {
    textAlignVertical: 'top',
    padding: 15,
    paddingTop: 5,
    fontSize: 17,
    letterSpacing: 0,
    ...sharedStyles.textRegular,
    flex: 1
  },
  closeModal: {
    alignSelf: 'flex-end',
    margin: 10,
    marginBottom: 0
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rightButtons: {
    flexDirection: 'row'
  },
});

const imagePickerConfig = {
  cropping: true,
  compressImageQuality: 0.8,
  avoidEmptySpaceAroundImage: false
};

const libraryPickerConfig = {
  mediaType: 'any'
};

const videoPickerConfig = {
  mediaType: 'video'
};

class FullScreenComposerView extends Component {
  static propTypes = {
    navigation: PropTypes.object,
    route: PropTypes.object,
    theme: PropTypes.string,
    baseUrl: PropTypes.string.isRequired,
    threadsEnabled: PropTypes.bool,
    user: PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
      token: PropTypes.string
    }),
    FileUpload_MediaTypeWhiteList: PropTypes.string,
    FileUpload_MaxFileSize: PropTypes.number,
    Message_AudioRecorderEnabled: PropTypes.bool,
    isMasterDetail: PropTypes.bool,
		/* rid: PropTypes.string.isRequired,
		message: PropTypes.object,
		replying: PropTypes.bool,
		editing: PropTypes.bool,
		isFocused: PropTypes.func,
		roomType: PropTypes.string,
		tmid: PropTypes.string,
		replyWithMention: PropTypes.bool,
		getCustomEmoji: PropTypes.func,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		theme: PropTypes.string,
		replyCancel: PropTypes.func,
		navigation: PropTypes.object,
		showActionSheet: PropTypes.func */
  }


  constructor(props) {
    super(props);
    const { route } = props;
    this.state = {
      mentions: [],
      showEmojiKeyboard: false,
      showSend: !!route.params?.text || false,
      recording: false,
      trackingType: '',
      file: {
        isVisible: false
      },
      commandPreview: [],
      showCommandPreview: false,
      command: {}
    };
    this.text = route.params?.text || '';
    this.focused = false;

    // MessageBox Actions
    this.options = [
      {
        title: I18n.t('Take_a_photo'),
        icon: 'image',
        onPress: this.takePhoto
      },
      {
        title: I18n.t('Take_a_video'),
        icon: 'video-1',
        onPress: this.takeVideo
      },
      {
        title: I18n.t('Choose_from_library'),
        icon: 'share',
        onPress: this.chooseFromLibrary
      },
      {
        title: I18n.t('Choose_file'),
        icon: 'folder',
        onPress: this.chooseFile
      },
      {
        title: I18n.t('Create_Discussion'),
        icon: 'chat',
        onPress: this.createDiscussion
      }
    ];

    const libPickerLabels = {
      cropperChooseText: I18n.t('Choose'),
      cropperCancelText: I18n.t('Cancel'),
      loadingLabelText: I18n.t('Processing')
    };
    this.imagePickerConfig = {
      ...imagePickerConfig,
      ...libPickerLabels
    };
    this.libraryPickerConfig = {
      ...libraryPickerConfig,
      ...libPickerLabels
    };
    this.videoPickerConfig = {
      ...videoPickerConfig,
      ...libPickerLabels
    };
  }

  async componentDidMount() {
    const db = database.active;
    const { route } = this.props;
    const { rid, tmid, navigation } = route.params;

    BackHandler.addEventListener('hardwareBackPress', this.backAction);
    let msg;
    try {
      const threadsCollection = db.collections.get('threads');
      const subsCollection = db.collections.get('subscriptions');
      if (tmid) {
        try {
          const thread = await threadsCollection.find(tmid);
          if (thread) {
            msg = thread.draftMessage;
          }
        } catch (error) {
          console.log('Messagebox.didMount: Thread not found');
        }
      } else {
        try {
          this.room = await subsCollection.find(rid);
          msg = this.room.draftMessage;
        } catch (error) {
          console.log('Messagebox.didMount: Room not found');
        }
      }
    } catch (e) {
      log(e);
    }

    if (msg) {
      this.setInput(msg);
      this.setShowSend(true);
    }

    if (isAndroid) {
      require('../../containers/MessageBox/EmojiKeyboard');
    }

    if (isTablet) {
      EventEmiter.addEventListener(KEY_COMMAND, this.handleCommands);
    }

    this.unsubscribeFocus = navigation.addListener('focus', () => {
      if (this.tracking && this.tracking.resetTracking) {
        this.tracking.resetTracking();
      }
    });
    this.unsubscribeBlur = navigation.addListener('blur', () => {
      this.component?.blur();
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { route } = this.props;
    const { editing, replying } = route.params;

    if (editing !== nextProps.editing && nextProps.editing) {
      this.setInput(nextProps.message.msg);
      if (this.text) {
        this.setShowSend(true);
      }
      this.focus();
    } else if (replying !== nextProps.replying && nextProps.replying) {
      this.focus();
    } else if (!nextProps.message) {
      this.clearInput();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      showEmojiKeyboard, showSend, recording, mentions, file, commandPreview
    } = this.state;
    const { route, theme } = this.props;
    const {
      roomType, replying, editing, message
    } = route.params;

    if (nextProps.route.params.theme !== theme) {
      return true;
    }
    if (nextProps.route.params.roomType !== roomType) {
      return true;
    }
    if (nextProps.route.params.replying !== replying) {
      return true;
    }
    if (nextProps.route.params.editing !== editing) {
      return true;
    }
    if (nextState.showEmojiKeyboard !== showEmojiKeyboard) {
      return true;
    }
    if (nextState.showSend !== showSend) {
      return true;
    }
    if (nextState.recording !== recording) {
      return true;
    }
    if (!equal(nextState.mentions, mentions)) {
      return true;
    }
    if (!equal(nextState.commandPreview, commandPreview)) {
      return true;
    }
    if (!equal(nextState.file, file)) {
      return true;
    }
    if (!equal(nextProps.route.params.message, message)) {
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    console.countReset(`${this.constructor.name}.render calls`);
    if (this.onChangeText && this.onChangeText.stop) {
      this.onChangeText.stop();
    }
    if (this.getUsers && this.getUsers.stop) {
      this.getUsers.stop();
    }
    if (this.getRooms && this.getRooms.stop) {
      this.getRooms.stop();
    }
    if (this.getEmojis && this.getEmojis.stop) {
      this.getEmojis.stop();
    }
    if (this.getSlashCommands && this.getSlashCommands.stop) {
      this.getSlashCommands.stop();
    }
    if (this.unsubscribeFocus) {
      this.unsubscribeFocus();
    }
    if (this.unsubscribeBlur) {
      this.unsubscribeBlur();
    }
    if (isTablet) {
      EventEmiter.removeListener(KEY_COMMAND, this.handleCommands);
    }
    BackHandler.removeEventListener('hardwareBackPress', this.backAction);
  }


  backAction = () => {
    return true;
  }

  onChangeText = (text) => {
    const isTextEmpty = text.length === 0;
    this.setShowSend(!isTextEmpty);
    this.debouncedOnChangeText(text);
    this.setInput(text);
  }

  // eslint-disable-next-line react/sort-comp
  debouncedOnChangeText = debounce(async (text) => {
    const db = database.active;
    const isTextEmpty = text.length === 0;
    // this.setShowSend(!isTextEmpty);
    this.handleTyping(!isTextEmpty);
    // matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
    const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
    if (slashCommand) {
      const [, name, params] = slashCommand;
      const commandsCollection = db.collections.get('slash_commands');
      try {
        const command = await commandsCollection.find(name);
        if (command.providesPreview) {
          return this.setCommandPreview(command, name, params);
        }
      } catch (e) {
        console.log('Slash command not found');
      }
    }

    if (!isTextEmpty) {
      try {
        const { start, end } = this.component?.lastNativeSelection;
        const cursor = Math.max(start, end);
        const lastNativeText = this.component?.lastNativeText || '';
        // matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
        const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
        const result = lastNativeText.substr(0, cursor).match(regexp);
        if (!result) {
          const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
          if (slash) {
            return this.identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
          }
          return this.stopTrackingMention();
        }
        const [, lastChar, name] = result;
        this.identifyMentionKeyword(name, lastChar);
      } catch (e) {
        log(e);
      }
    } else {
      this.stopTrackingMention();
    }
  }, 100)

  onKeyboardResigned = () => {
    this.closeEmoji();
  }

  onPressMention = (item) => {
    if (!this.component) {
      return;
    }
    const { trackingType } = this.state;
    const msg = this.text;
    const { start, end } = this.component?.lastNativeSelection;
    const cursor = Math.max(start, end);
    const regexp = /([a-z0-9._-]+)$/im;
    const result = msg.substr(0, cursor).replace(regexp, '');
    const mentionName = trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
      ? `${item.name || item}:`
      : (item.username || item.name || item.command);
    const text = `${result}${mentionName} ${msg.slice(cursor)}`;
    if ((trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) && item.providesPreview) {
      this.setState({ showCommandPreview: true });
    }
    this.setInput(text);
    this.focus();
    requestAnimationFrame(() => this.stopTrackingMention());
  }

  onPressCommandPreview = (item) => {
    const { command } = this.state;
    const { route } = this.props;
    const {
      rid, tmid, message: { id: messageTmid }, replyCancel
    } = route.params;
    const { text } = this;
    const name = text.substr(0, text.indexOf(' ')).slice(1);
    const params = text.substr(text.indexOf(' ') + 1) || 'params';
    this.setState({ commandPreview: [], showCommandPreview: false, command: {} });
    this.stopTrackingMention();
    this.clearInput();
    this.handleTyping(false);
    try {
      const { appId } = command;
      const triggerId = generateTriggerId(appId);
      RocketChat.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
      replyCancel();
    } catch (e) {
      log(e);
    }
  }

  onEmojiSelected = (keyboardId, params) => {
    const { text } = this;
    const { emoji } = params;
    let newText = '';
    // if messagebox has an active cursor
    if (this.component?.lastNativeSelection) {
      const { start, end } = this.component.lastNativeSelection;
      const cursor = Math.max(start, end);
      newText = `${text.substr(0, cursor)}${emoji}${text.substr(cursor)}`;
    } else {
      // if messagebox doesn't have a cursor, just append selected emoji
      newText = `${text}${emoji}`;
    }
    this.setInput(newText);
    this.setShowSend(true);
  }

  getPermalink = async (message) => {
    try {
      return await RocketChat.getPermalinkMessage(message);
    } catch (error) {
      return null;
    }
  }

  getFixedMentions = (keyword) => {
    let result = [];
    if ('all'.indexOf(keyword) !== -1) {
      result = [{ id: -1, username: 'all' }];
    }
    if ('here'.indexOf(keyword) !== -1) {
      result = [{ id: -2, username: 'here' }, ...result];
    }
    return result;
  }

  getUsers = debounce(async (keyword) => {
    let res = await RocketChat.search({ text: keyword, filterRooms: false, filterUsers: true });
    res = [...this.getFixedMentions(keyword), ...res];
    this.setState({ mentions: res });
  }, 300)

  getRooms = debounce(async (keyword = '') => {
    const res = await RocketChat.search({ text: keyword, filterRooms: true, filterUsers: false });
    this.setState({ mentions: res });
  }, 300)

  getEmojis = debounce(async (keyword) => {
    const db = database.active;
    if (keyword) {
      const customEmojisCollection = db.collections.get('custom_emojis');
      let customEmojis = await customEmojisCollection.query(
        Q.where('name', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
      ).fetch();
      customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
      const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
      const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
      this.setState({ mentions: mergedEmojis || [] });
    }
  }, 300)

  getSlashCommands = debounce(async (keyword) => {
    const db = database.active;
    const commandsCollection = db.collections.get('slash_commands');
    const commands = await commandsCollection.query(
      Q.where('id', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
    ).fetch();
    this.setState({ mentions: commands || [] });
  }, 300)

  focus = () => {
    if (this.component && this.component.focus) {
      this.component.focus();
    }
  }

  handleTyping = (isTyping) => {
    const { route } = this.props;
    const { typing, rid } = route.params;
    if (!isTyping) {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = false;
      }
      typing(rid, false);
      return;
    }

    if (this.typingTimeout) {
      return;
    }

    this.typingTimeout = setTimeout(() => {
      typing(rid, true);
      this.typingTimeout = false;
    }, 1000);
  }

  setCommandPreview = async (command, name, params) => {
    const { route } = this.props;
    const { rid } = route.params;
    try {
      const { preview } = await RocketChat.getCommandPreview(name, rid, params);
      this.setState({ commandPreview: preview.items, showCommandPreview: true, command });
    } catch (e) {
      this.setState({ commandPreview: [], showCommandPreview: true, command: {} });
      log(e);
    }
  }

  setInput = (text) => {
    this.text = text;
    if (this.component && this.component.setNativeProps) {
      this.component.setNativeProps({ text });
    }
  }

  setShowSend = (showSend) => {
    const { showSend: prevShowSend } = this.state;
    if (prevShowSend !== showSend) {
      this.setState({ showSend });
    }
  }

  clearInput = () => {
    this.setInput('');
    this.setShowSend(false);
  }

  canUploadFile = (file) => {
    const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
    const result = canUploadFile(file, { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize });
    if (result.success) {
      return true;
    }
    Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
    return false;
  }

  sendMediaMessage = async (file) => {
    const {
      baseUrl: server, user, route
    } = this.props;
    const { rid, tmid, message: { id: messageTmid }, replyCancel } = route.params;
    this.setState({ file: { isVisible: false } });
    const fileInfo = {
      name: file.name,
      description: file.description,
      size: file.size,
      type: file.mime,
      store: 'Uploads',
      path: file.path
    };
    try {
      replyCancel();
      await RocketChat.sendFileMessage(rid, fileInfo, tmid || messageTmid, server, user);
      Review.pushPositiveEvent();
    } catch (e) {
      log(e);
    }
  }

  takePhoto = async () => {
    try {
      const image = await ImagePicker.openCamera(this.imagePickerConfig);
      if (this.canUploadFile(image)) {
        this.showUploadModal(image);
      }
    } catch (e) {
      // Do nothing
    }
  }

  takeVideo = async () => {
    try {
      const video = await ImagePicker.openCamera(this.videoPickerConfig);
      if (this.canUploadFile(video)) {
        this.showUploadModal(video);
      }
    } catch (e) {
      // Do nothing
    }
  }

  chooseFromLibrary = async () => {
    try {
      const image = await ImagePicker.openPicker(this.libraryPickerConfig);
      if (this.canUploadFile(image)) {
        this.showUploadModal(image);
      }
    } catch (e) {
      // Do nothing
    }
  }

  chooseFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles]
      });
      const file = {
        filename: res.name,
        size: res.size,
        mime: res.type,
        path: res.uri
      };
      if (this.canUploadFile(file)) {
        this.showUploadModal(file);
      }
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        log(e);
      }
    }
  }

  createDiscussion = () => {
    const { isMasterDetail } = this.props;
    const params = { channel: this.room, showCloseModal: true };
    if (isMasterDetail) {
      Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
    } else {
      Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
    }
  }

  showUploadModal = (file) => {
    this.setState({ file: { ...file, isVisible: true } });
  }

  showMessageBoxActions = () => {
    const { route } = this.props;
    const { showActionSheet } = route.params;
    showActionSheet({ options: this.options });
  }

  editCancel = () => {
    const { route } = this.props;
    const { editCancel } = route.params;
    editCancel();
    this.clearInput();
  }

  openEmoji = async () => {
    await this.setState({
      showEmojiKeyboard: true
    });
  }

  recordAudioMessage = async () => {
    const recording = await Recording.permission();
    this.setState({ recording });
    this.closeModal();
  }

  closeEmoji = () => {
    this.setState({ showEmojiKeyboard: false });
  }

  submit = async (text) => {
    const { route } = this.props;
    const { rid: roomId, tmid, onSubmit } = route.params;
    const message = this.text;

    this.clearInput();
    this.debouncedOnChangeText.stop();
    this.closeEmoji();
    this.stopTrackingMention();
    this.handleTyping(false);
    if (message.trim() === '') {
      return;
    }

    this.closeModal();

    const {
      editing, replying, message: { id: messageTmid }, replyCancel
    } = route.params;

    // Slash command
    if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
      const db = database.active;
      const commandsCollection = db.collections.get('slash_commands');
      const command = message.replace(/ .*/, '').slice(1);
      const slashCommand = await commandsCollection.query(
        Q.where('id', Q.like(`${Q.sanitizeLikeString(command)}%`))
      ).fetch();
      if (slashCommand.length > 0) {
        try {
          const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
          const [{ appId }] = slashCommand;
          const triggerId = generateTriggerId(appId);
          RocketChat.runSlashCommand(command, roomId, messageWithoutCommand, triggerId, tmid || messageTmid);
          replyCancel();
        } catch (e) {
          log(e);
        }
        this.clearInput();
        return;
      }
    }
    // Edit
    if (editing) {
      const { message: editingMessage, editRequest } = route.params;
      const { id, subscription: { id: rid } } = editingMessage;
      editRequest({ id, msg: message, rid });

      // Reply
    } else if (replying) {
      const {
        message: replyingMessage, threadsEnabled, replyWithMention
      } = route.params;

      // Thread
      if (threadsEnabled && replyWithMention) {
        onSubmit(message, replyingMessage.id);

        // Legacy reply or quote (quote is a reply without mention)
      } else {
        const { user } = this.props;
        const { roomType } = route.params;
        const permalink = await this.getPermalink(replyingMessage);
        let msg = `[ ](${permalink}) `;

        // if original message wasn't sent by current user and neither from a direct room
        if (user.username !== replyingMessage.u.username && roomType !== 'd' && replyWithMention) {
          msg += `@${replyingMessage.u.username} `;
        }

        msg = `${msg} ${message}`;
        onSubmit(msg);
      }
      replyCancel();

      // Normal message
    } else {
      onSubmit(message);
    }

  }

  updateMentions = (keyword, type) => {
    if (type === MENTIONS_TRACKING_TYPE_USERS) {
      this.getUsers(keyword);
    } else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
      this.getEmojis(keyword);
    } else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
      this.getSlashCommands(keyword);
    } else {
      this.getRooms(keyword);
    }
  }

  identifyMentionKeyword = (keyword, type) => {
    this.setState({
      showEmojiKeyboard: false,
      trackingType: type
    });
    this.updateMentions(keyword, type);
  }

  stopTrackingMention = () => {
    const { trackingType, showCommandPreview } = this.state;
    if (!trackingType && !showCommandPreview) {
      return;
    }
    this.setState({
      mentions: [],
      trackingType: '',
      commandPreview: [],
      showCommandPreview: false
    });
  }

  handleCommands = ({ event }) => {
    if (handleCommandTyping(event)) {
      if (this.focused) {
        Keyboard.dismiss();
      } else {
        this.component.focus();
      }
      this.focused = !this.focused;
    } else if (handleCommandSubmit(event)) {
      this.submit();
    } else if (handleCommandShowUpload(event)) {
      this.showMessageBoxActions();
    }
  }

  replyCancel = () => {
    const { navigation, route } = this.props;
    const { replyCancel } = route.params;

    navigation.goBack();
    replyCancel();

  }

  closeModal = () => {
    const { navigation, route } = this.props;
    const { getFullScreenChanges } = route.params;
    const { commandPreview,
      showCommandPreview,
      mentions,
      trackingType,
      command,
      recording
    } = this.state;
    navigation.goBack();
    const args = {
      text: this.text,
      commandPreview,
      showCommandPreview,
      mentions,
      trackingType,
      command,
      recording
    };
    getFullScreenChanges(args);
  }

  renderCloseButton = () => {
    const { theme, editing } = this.props;
    const buttonStyle = {
      ...stylez.closeModal,
      backgroundColor: editing ? themes[theme].chatComponentBackground
        : themes[theme].messageboxBackground
    };
    return (
      <TouchableOpacity onPress={() => this.closeModal()} style={buttonStyle}>
        <CustomIcon name='Cross' size={30} color={themes[theme].tintColor} />
      </TouchableOpacity>
    );
  }

  renderContent = () => {
    const { theme, route, user } = this.props;
    const { text } = this;
    const { message, replying, getCustomEmoji } = route.params;

    const isAndroidTablet = isTablet && isAndroid ? {
      onSubmitEditing: this.submit,
      returnKeyType: 'send'
    } : {};

    return (
      <View style={{ flex: 1 }}>
        <TextInput
          ref={component => this.component = component}
          style={stylez.input}
          returnKeyType='default'
          keyboardType='twitter'
          blurOnSubmit={false}
          placeholder={I18n.t('New_Message')}
          onChangeText={this.onChangeText}
          underlineColorAndroid='transparent'
          defaultValue={text}
          multiline
          autoFocus
          testID='full-screen-messagebox-input'
          theme={theme}
          {...isAndroidTablet}
        />
        <ReplyPreview
          message={message}
          close={this.replyCancel}
          username={user.username}
          replying={replying}
          getCustomEmoji={getCustomEmoji}
          theme={theme}
        />
      </View>
    );
  }

  renderBottomBar = () => {
    const { theme, route, Message_AudioRecorderEnabled } = this.props;
    const {
      editing
    } = route.params;
    const { showEmojiKeyboard, showSend, commandPreview, showCommandPreview, mentions, trackingType } = this.state;

    return (
      <>
        <CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
        <Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
        <View style={[stylez.buttons, { backgroundColor: themes[theme].messageboxBackground }, editing && { backgroundColor: themes[theme].chatComponentBackground }]}>
          <LeftButtons
            theme={theme}
            showEmojiKeyboard={showEmojiKeyboard}
            editing={editing}
            showMessageBoxActions={this.showMessageBoxActions}
            editCancel={this.editCancel}
            openEmoji={this.openEmoji}
            closeEmoji={this.closeEmoji}
          />
          <View style={stylez.rightButtons}>
            <RightButtons
              theme={theme}
              showSend={showSend}
              submit={this.submit}
              recordAudioMessage={this.recordAudioMessage}
              recordAudioMessageEnabled={Message_AudioRecorderEnabled}
              showMessageBoxActions={this.showMessageBoxActions}
            />
          </View>
        </View>
      </>
    );
  }

  render() {
    console.count(`${this.constructor.name}.render calls`);
    const { route, theme, user, baseUrl } = this.props;
    const { editing } = route.params;
    const { showEmojiKeyboard } = this.state;
    const backgroundColor = editing ? themes[theme].chatComponentBackground : themes[theme].messageboxBackground;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        {this.renderCloseButton()}
        <MessageboxContext.Provider
          value={{
            user,
            baseUrl,
            onPressMention: this.onPressMention,
            onPressCommandPreview: this.onPressCommandPreview
          }}
        >
          {this.renderContent()}
          <KeyboardAccessoryView
            ref={ref => this.tracking = ref}
            renderContent={this.renderBottomBar}
            kbInputRef={this.component}
            kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
            onKeyboardResigned={this.onKeyboardResigned}
            onItemSelected={this.onEmojiSelected}
            trackInteractive
            // revealKeyboardInteractive
            requiresSameParentToManageScrollView
            addBottomView
            bottomViewColor={themes[theme].messageboxBackground}
          />
        </MessageboxContext.Provider>
      </SafeAreaView>
    );
  };
}

const mapStateToProps = state => ({
  isMasterDetail: state.app.isMasterDetail,
  baseUrl: state.server.server,
  threadsEnabled: state.settings.Threads_enabled,
  user: getUserSelector(state),
  FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
  FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
  Message_AudioRecorderEnabled: state.settings.Message_AudioRecorderEnabled
});

const dispatchToProps = ({
  typing: (rid, status) => userTypingAction(rid, status)
});

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(withActionSheet(withTheme(FullScreenComposerView)));