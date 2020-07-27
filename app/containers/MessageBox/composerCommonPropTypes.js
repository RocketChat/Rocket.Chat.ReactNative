import PropTypes from 'prop-types';

const commonPropTypes = {
  closeEmoji: PropTypes.func,
  commandPreview: PropTypes.array,
  editing: PropTypes.bool,
  editCancel: PropTypes.func,
  finishAudioMessage: PropTypes.func,
  getCustomEmoji: PropTypes.func,
  iOSScrollBehavior: PropTypes.number,
  isActionsEnabled: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  mentions: PropTypes.array,
  message: PropTypes.object,
  Message_AudioRecorderEnabled: PropTypes.bool,
  onChangeText: PropTypes.func,
  onEmojiSelected: PropTypes.func,
  onKeyboardResigned: PropTypes.func,
  openEmoji: PropTypes.func,
  recording: PropTypes.bool,
  recordingCallback: PropTypes.func,
  replying: PropTypes.bool,
  replyCancel: PropTypes.func,
  showSend: PropTypes.bool,
  showEmojiKeyboard: PropTypes.bool,
  showCommandPreview: PropTypes.bool,
  showMessageBoxActions: PropTypes.func,
  submit: PropTypes.func,
  text: PropTypes.string,
  toggleRecordAudioWithState: PropTypes.func,
  theme: PropTypes.string,
  toggleFullScreen: PropTypes.func,
  trackingType: PropTypes.string,
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    token: PropTypes.string
  }),
  innerRef: PropTypes.object
};

export default commonPropTypes;