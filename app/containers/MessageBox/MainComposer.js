import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, TouchableOpacity
} from 'react-native';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';

import TextInput from '../../presentation/TextInput';
import styles from './styles';
import Recording from './Recording';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import { themes } from '../../constants/colors';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import Mentions from './Mentions';
import CommandsPreview from './CommandsPreview';
import { CustomIcon } from '../../lib/Icons';

const MainComposer = React.forwardRef(({
  children,
  closeEmoji,
  toggleFullScreen,
  commandPreview,
  editCancel,
  editing,
  finishAudioMessage,
  getCustomEmoji,
  iOSScrollBehavior,
  isActionsEnabled,
  isFullScreen,
  mentions,
  message,
  Message_AudioRecorderEnabled,
  onChangeText,
  onKeyboardResigned,
  onEmojiSelected,
  openEmoji,
  recording,
  recordAudioMessage,
  replyCancel,
  replying,
  showCommandPreview,
  showEmojiKeyboard,
  showMessageBoxActions,
  showSend,
  submit,
  text,
  theme,
  trackingType,
  user
}, ref) => {


  function renderTopButton() {
    const buttonStyle = {
      ...styles.textBoxTopButton,
      backgroundColor: editing ? themes[theme].chatComponentBackground
        : themes[theme].messageboxBackground
    };

    return (
      <TouchableOpacity onPress={() => toggleFullScreen()} style={buttonStyle}>
        <CustomIcon name='chevron-up' size={24} color={themes[theme].tintColor} />
      </TouchableOpacity>
    );
  }

  function renderContent() {
    const isAndroidTablet = isTablet && isAndroid ? {
      multiline: false,
      onSubmitEditing: submit,
      returnKeyType: 'send'
    } : {};

    if (recording) {
      return <Recording theme={theme} onFinish={finishAudioMessage} />;
    }
    return (
      <>
        <CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
        <Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
        <View style={[styles.composer, { borderTopColor: themes[theme].separatorColor }]}>
          {isActionsEnabled && !isFullScreen ? renderTopButton() : null}
          <ReplyPreview
            message={message}
            close={replyCancel}
            username={user.username}
            replying={replying}
            getCustomEmoji={getCustomEmoji}
            theme={theme}
          />
          <View
            style={[
              styles.textArea,
              { backgroundColor: themes[theme].messageboxBackground }, editing && { backgroundColor: themes[theme].chatComponentBackground }
            ]}
            testID='messagebox'
          >
            <LeftButtons
              theme={theme}
              showEmojiKeyboard={showEmojiKeyboard}
              editing={editing}
              showMessageBoxActions={showMessageBoxActions}
              isActionsEnabled={isActionsEnabled}
              editCancel={editCancel}
              openEmoji={openEmoji}
              closeEmoji={closeEmoji}
            />
            <TextInput
              ref={ref}
              style={styles.textBoxInput}
              returnKeyType='default'
              keyboardType='twitter'
              blurOnSubmit={false}
              placeholder={I18n.t('New_Message')}
              onChangeText={onChangeText}
              underlineColorAndroid='transparent'
              defaultValue={text}
              multiline
              testID='messagebox-input'
              theme={theme}
              {...isAndroidTablet}
            />
            <RightButtons
              theme={theme}
              showSend={showSend}
              submit={submit}
              recordAudioMessage={recordAudioMessage}
              recordAudioMessageEnabled={Message_AudioRecorderEnabled}
              showMessageBoxActions={showMessageBoxActions}
              isActionsEnabled={isActionsEnabled}
            />
          </View>
        </View>
        {children}
      </>
    );
  }


  return (
    <KeyboardAccessoryView
      ref={ref => this.tracking = ref}
      renderContent={renderContent}
      kbInputRef={ref}
      kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
      onKeyboardResigned={onKeyboardResigned}
      onItemSelected={onEmojiSelected}
      trackInteractive
      // revealKeyboardInteractive
      requiresSameParentToManageScrollView
      addBottomView
      bottomViewColor={themes[theme].messageboxBackground}
      iOSScrollBehavior={iOSScrollBehavior}
    />
  );

});

MainComposer.propTypes = {
  showEmojiKeyboard: PropTypes.bool,
  showSend: PropTypes.bool,
  mentions: PropTypes.array,
  trackingType: PropTypes.array,
  commandPreview: PropTypes.array,
  showCommandPreview: PropTypes.bool,
  editing: PropTypes.bool,
  theme: PropTypes.string,
  Message_AudioRecorderEnabled: PropTypes.bool,
  isFullScreen: PropTypes.bool,
  message: PropTypes.object,
  replying: PropTypes.bool,
  replyCancel: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    token: PropTypes.string
  }),
  getCustomEmoji: PropTypes.func,
  iOSScrollBehavior: PropTypes.number,
  toggleFullScreen: PropTypes.func,
  tracking: PropTypes.object,
  onKeyboardResigned: PropTypes.func,
  onEmojiSelected: PropTypes.func,
  submit: PropTypes.func,
  onChangeText: PropTypes.func,
  text: PropTypes.string,
  editCancel: PropTypes.func,
  closeEmoji: PropTypes.func,
  openEmoji: PropTypes.func,
  recordAudioMessage: PropTypes.func,
  recording: PropTypes.bool,
  children: PropTypes.node,
  isActionsEnabled: PropTypes.bool,
  finishAudioMessage: PropTypes.func
}

export default MainComposer;