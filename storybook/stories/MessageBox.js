import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

import MessageboxContext from '../../app/containers/MessageBox/Context';
import MainComposer from '../../app/containers/MessageBox/MainComposer';
import FullScreenComposer from '../../app/containers/MessageBox/FullScreenComposer';
import StoriesSeparator from './StoriesSeparator';

import { themes } from '../../app/constants/colors';

let _theme = 'light';

const styles = StyleSheet.create({
  separator: {
    marginTop: 30,
    marginBottom: 20
  },
  modal: {
    height: 400
  }
});

const user = {
  id: '2hk9RMaZxhQPD5m4Q',
  username: 'ezequiel.reis',
  token: 'WNOFyZdehMX6dVPaVQOo_goD1t4QFRi9EV9KH5nB-0J'
};

const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.😃😇😃😇😃😇😃😇😃😇😃😇😃😇';
const baseUrl = 'https://open.rocket.chat';

const getCustomEmoji = (content) => {
  const customEmoji = {
    marioparty: { name: content, extension: 'gif' },
    react_rocket: { name: content, extension: 'png' },
    nyan_rocket: { name: content, extension: 'png' }
  }[content];
  return customEmoji;
};

const Main = props => (
  <MainComposer
    ref={{
      component: {},
      tracking: {}
    }}
    closeEmoji={() => { }}
    toggleFullScreen={() => { }}
    commandPreview={[]}
    editCancel={() => { }}
    editing={false}
    finishAudioMessage={() => { }}
    getCustomEmoji={getCustomEmoji}
    iOSScrollBehavior={0}
    isActionsEnabled={true}
    isFullScreen={false}
    mentions={[]}
    message={""}
    Message_AudioRecorderEnabled={true}
    onChangeText={() => { }}
    onKeyboardResigned={() => { }}
    onEmojiSelected={() => { }}
    openEmoji={() => { }}
    recording={false}
    recordingCallback={() => { }}
    recordStartState={false}
    replyCancel={() => { }}
    replying={false}
    showCommandPreview={false}
    showEmojiKeyboard={false}
    showMessageBoxActions={() => { }}
    showSend={false}
    submit={() => { }}
    text={""}
    toggleRecordAudioWithState={() => { }}
    theme={_theme}
    trackingType={false}
    user={user}
    {...props}
  />
);

const FullScreen = props => (
  <View style={styles.modal}>
    <FullScreenComposer
      ref={{
        component: {},
        tracking: {}
      }}
      closeEmoji={() => { }}
      toggleFullScreen={() => { }}
      commandPreview={[]}
      editCancel={() => { }}
      editing={false}
      getCustomEmoji={getCustomEmoji}
      iOSScrollBehavior={0}
      isActionsEnabled={true}
      isFullScreen={true}
      mentions={[]}
      message={""}
      Message_AudioRecorderEnabled={true}
      onChangeText={() => { }}
      onKeyboardResigned={() => { }}
      onEmojiSelected={() => { }}
      openEmoji={() => { }}
      recording={false}
      recordingCallback={() => { }}
      replyCancel={() => { }}
      replying={false}
      showCommandPreview={false}
      showEmojiKeyboard={false}
      showMessageBoxActions={() => { }}
      showSend={false}
      submit={() => { }}
      text={() => { }}
      theme={_theme}
      toggleRecordAudioWithState={() => { }}
      trackingType={false}
      user={user}
      autoFocus={false}
			backdropOpacity={0}
      {...props}
    />
  </View>
);


// eslint-disable-next-line react/prop-types
const Separator = ({ title, theme }) => <StoriesSeparator title={title} theme={theme} style={styles.separator} />;

export default ({ theme }) => {
  _theme = theme;
  return (
    <ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
      <MessageboxContext.Provider
        value={{
          user,
          baseUrl,
          onPressMention: () => { },
          onPressCommandPreview: () => { }
        }}
      >

        <Separator title='Simple' theme={theme} />
        <Main />

        <Separator title='Simple with content' theme={theme} />
        <Main showSend={true} text={"A simple text"} />

        <Separator title='Editing' theme={theme} />
        <Main editing={true} text={"Editable message"} showSend={true} />

        <Separator title='Replying' theme={theme} />
        <Main
          message={
            {
              u: { "username": "ezequiel.reis", "name": "Ezequiel" },
              msg: "Message to reply 👊🤙👏"
            }
          }
          replying={true}
          replyCancel={() => { }}
        />

        <Separator title='Simple' theme={theme} />
        <FullScreen />

        <Separator title='Simple with content' theme={theme} />
        <FullScreen showSend={true} text={longText} />

        <Separator title='Editing' theme={theme} />
        <FullScreen editing={true} text={"Editing this too long message. " + longText} showSend={true} />

        <Separator title='Replying' theme={theme} />
        <FullScreen
          message={
            {
              u: { "username": "ezequiel.reis", "name": "Ezequiel" },
              msg: "Message to reply 👊🤙👏"
            }
          }
          replying={true}
          replyCancel={() => { }}
        />

      </MessageboxContext.Provider>
    </ScrollView>
  )
};