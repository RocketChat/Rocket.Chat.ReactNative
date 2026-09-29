const { createElement } = require('react');
const { Text: RNText } = require('react-native');

const { unstable_mapTextProps } = jest.requireActual('react-native-plain-text');

const Text = props => {
	const nativeProps = unstable_mapTextProps(props);
	if (nativeProps === null) {
		return createElement(RNText, props);
	}
	const { accessible, accessibilityRole, accessibilityLabel } = nativeProps;
	return createElement(RNText, { ...props, accessible, accessibilityRole, accessibilityLabel });
};

module.exports = { PlainText: Text, Text };
