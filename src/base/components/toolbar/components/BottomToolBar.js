/**
 * for ImagePicker
 */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { RadioGroup, RadioButton } from "react-native-flexi-radio-button";

import { BarTemplate, BAR_POSITIONS } from "./BarTemplate";

export default class BottomToolBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: props.middleBtSelected ? 0 : null
    };
  }

  _renderLeftButton() {
    //, position: 'absolute', left: 16
    if (this.props.renderLeftButton) {
      return this.props.renderLeftButton();
    }

    const { leftButtonDisabled } = this.props; //选择图片数量

    return (
      <TouchableOpacity
        style={[{ flex: 0, width: 60, justifyContent: "flex-start" }]}
        onPress={this.props.leftButtonPressed}
        disabled={leftButtonDisabled}
      >
        <Text
          style={[
            styles.buttonText,
            leftButtonDisabled ? { color: "gray" } : null
          ]}
        >
          {this.props.leftButtonText}
        </Text>
      </TouchableOpacity>
    );
  }

  onSelect(index, value) {
    if (this.state.selectedIndex !== null) {
      if (this.props.middleButtonPressed) {
        this.props.middleButtonPressed(false);
      }
      this.setState({
        selectedIndex: null
      });
    } else {
      if (this.props.middleButtonPressed) {
        this.props.middleButtonPressed(true);
      }
      this.setState({
        selectedIndex: index
      });
    }
  }

  _renderMiddleButton() {
    if (this.props.renderMiddleButton) {
      return this.props.renderMiddleButton();
    }
    return (
      <RadioGroup
        ref={ref => (this.radioBtRef = ref)}
        selectedIndex={this.state.selectedIndex}
        onSelect={(index, value) => this.onSelect(index, value)}
      >
        <RadioButton value={"item1"}>
          <Text style={{ color: "white" }}>{this.props.middleButtonText}</Text>
        </RadioButton>
      </RadioGroup>
      // <TouchableOpacity style={[{ flex: 0, width: 60, justifyContent: 'flex-start' }]} onPress={()=>{this.props.middleButtonPressed()}}>
      //   <Text style={styles.buttonText}>{'原图'}</Text>
      // </TouchableOpacity>
    );
  }

  _renderRightButton() {
    if (this.props.renderRightButton) {
      return this.props.renderRightButton();
    }

    const { rightButtonDisabled, rightButtonText } = this.props; //选择图片数量

    return (
      <TouchableOpacity
        style={[
          styles.button,
          { flex: 0 },
          rightButtonDisabled ? { backgroundColor: "gray" } : null
        ]}
        onPress={this.props.rightButtonPressed}
        disabled={rightButtonDisabled}
      >
        <Text style={styles.sendText}>
          {rightButtonText}
          {/* {selected
            ? this.props.translate("ran.chat.Send") + "(" + selected + ")"
            : this.props.translate("ran.chat.Send")} */}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const { displayed, height } = this.props;

    return (
      <BarTemplate
        position={BAR_POSITIONS.BOTTOM}
        displayed={displayed}
        height={height}
        style={styles.container}
      >
        <View style={styles.container}>
          {this._renderLeftButton()}
          {this._renderMiddleButton()}
          {this._renderRightButton()}
        </View>
      </BarTemplate>
    );
  }
}

// export default hoistStatics(compose(translate))(BottomToolBar);

const color = "white";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    minHeight: 44,
    backgroundColor: "#353535",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8
  },

  button: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 35,
    backgroundColor: "green",
    borderRadius: 5
  },
  sendText: {
    color: "white",
    textAlign: "center",
    alignItems: "center"
  },
  buttonText: {
    color: "white"
  },
  arrowContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
    // paddingHorizontal: 16,
  },

  buttonImage: {
    marginTop: 8
  }
});

BottomToolBar.defaultProps = {
  displayed: true,
  buttonEnabled: true,
  leftButtonDisabled: false,
  rightButtonDisabled: false
};

BottomToolBar.propTypes = {
  displayed: PropTypes.bool,
  height: PropTypes.number,
  leftButtonDisabled: PropTypes.bool,
  rightButtonDisabled: PropTypes.bool,
  leftButtonPressed: PropTypes.func,
  // middleButtonPressed: PropTypes.func,
  rightButtonPressed: PropTypes.func,
  leftButtonText: PropTypes.string,
  middleButtonText: PropTypes.string,
  rightButtonText: PropTypes.string,
  renderLeftButton: PropTypes.func,
  renderMiddleButton: PropTypes.func,
  renderRightButton: PropTypes.func,
  buttonEnabled: PropTypes.bool
};
