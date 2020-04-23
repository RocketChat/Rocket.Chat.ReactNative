import React from 'react';
import { TouchableHighlight, Text } from 'react-native';

import styles from './styles';

const ButtonNumber = ({ text }) => (
	<TouchableHighlight
		style={[
			styles.buttonCircle,
			// { backgroundColor: this.props.colorCircleButtons },
			// this.props.styleButtonCircle,
		]}
		// underlayColor={this.props.numbersButtonOverlayColor}
		// disabled={disabled}
		// onShowUnderlay={() => this.setState({ textButtonSelected: text })}
		// onHideUnderlay={() => this.setState({ textButtonSelected: "" })}
		// onPress={() => {
		// 	this.onPressButtonNumber(text);
		// }}
		// accessible
		// accessibilityLabel={text}
	>
		<Text
			style={[
				styles.text,
				// this.props.styleTextButton,
				// {
				// 	opacity: opacity,
				// 	color: this.state.textButtonSelected === text
				// 			? this.props.styleColorButtonTitleSelected
				// 			: this.props.styleColorButtonTitle
				// }
			]}
		>
			{text}
		</Text>
	</TouchableHighlight>
);

export default ButtonNumber;
