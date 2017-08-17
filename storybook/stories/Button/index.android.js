/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */

import React, { PropTypes } from 'react';
import { TouchableNativeFeedback } from 'react-native';

export default function Button(props) {
  return (
    <TouchableNativeFeedback onPress={props.onPress}>
      {props.children}
    </TouchableNativeFeedback>
  );
}

Button.defaultProps = {
  children: null,
  onPress: () => {},
};

Button.propTypes = {
  children: PropTypes.node,
  onPress: PropTypes.func,
};
