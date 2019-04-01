/**
 * InputToolbar
 * the Component which show Composer area
 *
 * @zack
 */

import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  View,
  ViewPropTypes,
  TextInput
} from "react-native";
import PropTypes from "prop-types";

class Composer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      composerHeight: Platform.select({
        ios: 33,
        android: 41
      })
    };

    this._onBlur = this._onBlur.bind(this);
  }

  render() {
    return (
      <TextInput
        ref="composerInput"
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        multiline={this.props.multiline}
        onContentSizeChange={e => this.onContentSizeChange(e)}
        onChangeText={text => this.onChangeText(text)}
        onBlur={this._onBlur}
        style={[
          styles.textInputStyle,
          this.props.textInputStyle,
          {
            height: this.props.composerHeight
              ? this.props.composerHeight
              : this.state.composerHeight
          }
        ]}
        value={this.props.text ? this.props.text : this.state.text}
        accessibilityLabel={this.props.text || this.props.placeholder}
        enablesReturnKeyAutomatically={true}
        underlineColorAndroid="transparent"
        {...this.props.textInputProps}
      />
    );
  }

  onContentSizeChange(e) {
    const contentSize = e.nativeEvent.contentSize;
    if (!this.contentSize) {
      this.contentSize = contentSize;
      this.props.onContentSizeChange(this.contentSize);
    } else if (
      this.contentSize.width !== contentSize.width ||
      this.contentSize.height !== contentSize.height
    ) {
      this.contentSize = contentSize;
      this.props.onContentSizeChange(this.contentSize);
    }
  }

  onChangeText(text) {
    this.props.onTextChanged(text);
  }

  setText(text) {
    this.setState({
      text: text
    });
  }

  setComposerHeight(height) {
    this.setState({
      composerHeight: height
    });
  }

  _onBlur() {
    if (this.props.onComposerBlur) {
      this.props.onComposerBlur();
    }
  }
}

const styles = StyleSheet.create({
  textInputStyle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    lineHeight: 16,
    marginTop: Platform.select({
      ios: 6,
      android: 0
    }),
    marginBottom: Platform.select({
      ios: 5,
      android: 3
    })
  }
});

Composer.defaultProps = {
  onChange: () => {},
  placeholder: "",
  placeholderTextColor: "#b2b2b2",
  multiline: true,
  onContentSizeChange: () => {},
  onTextChanged: () => {},
  textInputStyle: {},
  composerHeight: null,
  text: "",
  textInputProps: null
};

Composer.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  placeholderTextColor: PropTypes.string,
  multiline: PropTypes.bool,
  onContentSizeChange: PropTypes.func,
  onTextChanged: PropTypes.func,
  textInputStyle: TextInput.propTypes.style,
  composerHeight: PropTypes.number,
  text: PropTypes.string,
  textInputProps: PropTypes.object,
  onComposerBlur: PropTypes.func
};

module.exports = Composer;
