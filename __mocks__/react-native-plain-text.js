const { createElement } = require('react');
const { Text: RNText } = require('react-native');

const Text = ({ deopt, text, ...props }) => createElement(RNText, props, text ?? props.children);

module.exports = { Text };
