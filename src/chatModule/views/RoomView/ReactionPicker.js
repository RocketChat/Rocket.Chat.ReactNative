import React from "react";
import PropTypes from "prop-types";
import { View, Platform } from "react-native";
import { connect } from "react-redux";
import Modal from "react-native-modal";
import { responsive } from "react-native-responsive-ui";
import EmojiPicker from "../../containers/EmojiPicker";
import { toggleReactionPicker } from "../../actions/messages";
import styles from "./styles";

const margin = Platform.OS === "android" ? 40 : 20;
const tabEmojiStyle = { fontSize: 15 };

@connect(
  state => ({
    showReactionPicker: state.messages.showReactionPicker,
    baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
  }),
  dispatch => ({
    toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
  })
)
@responsive
export default class ReactionPicker extends React.Component {
  static propTypes = {
    baseUrl: PropTypes.string.isRequired,
    window: PropTypes.any,
    showReactionPicker: PropTypes.bool,
    toggleReactionPicker: PropTypes.func,
    onEmojiSelected: PropTypes.func
  };

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.showReactionPicker !== this.props.showReactionPicker ||
      this.props.window.width !== nextProps.window.width
    );
  }

  onEmojiSelected(emoji, shortname) {
    // standard emojis: `emoji` is unicode and `shortname` is :joy:
    // custom emojis: only `emoji` is returned with shortname type (:joy:)
    // to set reactions, we need shortname type
    this.props.onEmojiSelected(shortname || emoji);
  }

  render() {
    const {
      window: { width, height },
      showReactionPicker,
      baseUrl
    } = this.props;

    return showReactionPicker ? (
      <Modal
        isVisible={this.props.showReactionPicker}
        style={{ alignItems: "center" }}
        onBackdropPress={() => this.props.toggleReactionPicker()}
        onBackButtonPress={() => this.props.toggleReactionPicker()}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View
          style={[
            styles.reactionPickerContainer,
            {
              width: width - margin,
              height: Math.min(width, height) - margin * 2
            }
          ]}
          testID="reaction-picker"
        >
          <EmojiPicker
            tabEmojiStyle={tabEmojiStyle}
            width={Math.min(width, height) - margin}
            onEmojiSelected={(emoji, shortname) =>
              this.onEmojiSelected(emoji, shortname)
            }
            baseUrl={baseUrl}
          />
        </View>
      </Modal>
    ) : null;
  }
}
