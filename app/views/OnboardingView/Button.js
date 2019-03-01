import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableWithoutFeedback } from 'react-native';

import styles from './styles';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string,
		subtitle: PropTypes.string,
		type: PropTypes.string,
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
			title, subtitle, type, onPress, icon, testID
		} = this.props;
		const { active } = this.state;
		const activeStyle = active && styles.buttonActive;
		return (
			<TouchableWithoutFeedback
				onPress={onPress}
				onPressIn={() => this.setState({ active: true })}
				onPressOut={() => this.setState({ active: false })}
				testID={testID}
			>
				<View style={[styles.buttonContainer, styles[`button_container_${ type }`]]}>
					<View style={styles.buttonIconContainer}>
						{icon}
					</View>
					<View style={styles.buttonCenter}>
						<Text style={[styles.buttonTitle, styles[`button_text_${ type }`], activeStyle]}>{title}</Text>
						{subtitle ? <Text style={[styles.buttonSubtitle, activeStyle]}>{subtitle}</Text> : null}
					</View>
					{type === 'secondary' ? <DisclosureIndicator /> : null}
				</View>
			</TouchableWithoutFeedback>
		);
	}
}
