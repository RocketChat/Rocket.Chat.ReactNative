/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */

import React, { PropTypes } from 'react';
import { TouchableHighlight } from 'react-native';

export default function Button(props) {
  return (
    <TouchableHighlight onPress={props.onPress}>
      {props.children}
    </TouchableHighlight>
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
