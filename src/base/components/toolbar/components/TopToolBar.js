import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import EStyleSheet from 'react-native-extended-stylesheet';

import { BarTemplate, BAR_POSITIONS } from './BarTemplate';

export default class TopToolBar extends Component {

  _renderLeftButton() {
    if (this.props.renderLeftButton){
      return this.props.renderLeftButton();
    }

    return (
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={this.props.leftButtonPressed}>
        <Text style={styles.buttonText}>
          {this.props.leftButtonText}
        </Text>
      </TouchableOpacity>
    );
  }

  _renderTitle() {
    if (this.props.renderTitle){
      return this.props.renderTitle();
    }
    return (
      <View style={{height: 44, justifyContent: 'center',
      alignItems: 'center'}}>
        <Text style={[styles.buttonText, {maxWidth: 200}]} numberOfLines={1}>
          {this.props.title}
        </Text>
      </View>

    );
  }

  _renderRightButton() {
    if (this.props.renderRightButton){
      return this.props.renderRightButton();
    }

    const { rightBtEnabled } = this.props;

    return (
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={this.props.rightButtonPressed}
        disabled={rightBtEnabled ? false : true}>
        <Text style={[styles.buttonText, {textAlign: 'right', color: 'green'}, rightBtEnabled ? null : {color: 'gray'}]}>
          {this.props.rightButtonText}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const { displayed, height } = this.props;

    return (
      <BarTemplate
        position={BAR_POSITIONS.TOP}
        displayed={displayed}
        height={height}
        style={styles.container}
      >
        <View style={styles.container}>
          {this._renderLeftButton()}
          {this._renderTitle()}
          {this._renderRightButton()}
        </View>
      </BarTemplate>
    );
  }
}

const color = 'white';

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 64,//'$STATUSBAR_HEIGHT64' + 44,
    backgroundColor: '#353535',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flex: 0,
    height: 44,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: '$TEXT_HUGETEXT',
    fontWeight: 'normal',
  },
});

TopToolBar.defaultProps = {
  displayed: true,
  rightBtEnabled: true,
};

TopToolBar.propTypes = {
  displayed: PropTypes.bool,
  height: PropTypes.number,
  selected: PropTypes.number,
  leftButtonPressed: PropTypes.func,
  // middleButtonPressed: PropTypes.func,
  rightButtonPressed: PropTypes.func,
  leftButtonText: PropTypes.string,
  renderLeftButton: PropTypes.func,
  renderMiddleButton: PropTypes.func,
  renderRightButton: PropTypes.func,
  rightBtEnabled: PropTypes.bool,
};
