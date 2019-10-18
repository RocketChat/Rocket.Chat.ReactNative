import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableWithoutFeedback } from 'react-native';

import styles from './styles';
import { themes, COLOR_WHITE } from '../../constants/colors';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string,
		subtitle: PropTypes.string,
		type: PropTypes.string,
		theme: PropTypes.string,
		icon: PropTypes.node.isRequired,
		testID: PropTypes.string.isRequired,
		onPress: PropTypes.func
	}

	static defaultProps = {
		title: 'Press me!',
		type: 'primary',
		onPress: () => alert('It works!')
	}

	state = {
		active: false
	};

	render() {
		const {
			title, subtitle, type, onPress, icon, testID, theme
		} = this.props;
		const { active } = this.state;
		const activeStyle = active && styles.buttonActive;
		const isPrimary = (type === 'primary');
		const buttonContainerStyle = {
			backgroundColor: isPrimary ? themes[theme].actionTintColor : themes[theme].backgroundColor,
			borderColor: isPrimary ? themes[theme].actionTintColor : themes[theme].borderColor
		};
		return (
			<TouchableWithoutFeedback
				onPress={onPress}
				onPressIn={() => this.setState({ active: true })}
				onPressOut={() => this.setState({ active: false })}
				testID={testID}
			>
				<View style={[styles.buttonContainer, buttonContainerStyle]}>
					<View style={styles.buttonIconContainer}>
						{icon}
					</View>
					<View style={styles.buttonCenter}>
						<Text style={[styles.buttonTitle, { color: isPrimary ? COLOR_WHITE : themes[theme].tintColor }, activeStyle]}>{title}</Text>
						{subtitle ? <Text style={[styles.buttonSubtitle, activeStyle, { color: themes[theme].auxiliaryText }]}>{subtitle}</Text> : null}
					</View>
					{type === 'secondary' ? <DisclosureIndicator /> : null}
				</View>
			</TouchableWithoutFeedback>
		);
	}
}
