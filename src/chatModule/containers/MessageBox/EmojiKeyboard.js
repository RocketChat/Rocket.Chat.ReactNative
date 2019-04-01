import React from "react";
import { View } from "react-native";
// import { KeyboardRegistry } from 'react-native-keyboard-input';

import { store } from "../../../src";
import EmojiPicker from "../EmojiPicker";
import styles from "./styles";

export default class EmojiKeyboard extends React.PureComponent {
  constructor(props) {
    super(props);
    const state = store.getState();
    this.baseUrl =
      state.settings.Site_Url || state.server ? state.server.server : "";
  }
  onEmojiSelected = emoji => {
    console.log(emoji);
    this.props.onEmojiSelected(emoji);
    // KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
  };
  render() {
    return (
      <View
        style={styles.emojiKeyboardContainer}
        testID="messagebox-keyboard-emoji"
      >
        <EmojiPicker
          onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
          baseUrl={this.baseUrl}
        />
      </View>
    );
  }
}
// KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
