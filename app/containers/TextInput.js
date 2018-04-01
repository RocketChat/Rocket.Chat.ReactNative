import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import PropTypes from 'prop-types';

import Icon from 'react-native-vector-icons/FontAwesome';

import sharedStyles from '../views/Styles';
import { COLOR_DANGER } from '../constants/colors';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 20
	},
	label: {
		marginBottom: 4,
		fontSize: 16
	},
	input: {
		paddingTop: 12,
		paddingBottom: 12,
		paddingHorizontal: 10,
		borderWidth: 2,
		borderRadius: 2,
		backgroundColor: 'white',
		borderColor: 'rgba(0,0,0,.15)',
		color: 'black'
	},
	labelError: {
		color: COLOR_DANGER
	},
	inputError: {
		color: COLOR_DANGER,
		borderColor: COLOR_DANGER
	},
	wrap: {
		flex: 1,
		position: 'relative'
	},
	icon: {
		position: 'absolute',
		right: 0,
		padding: 10,
		color: 'rgba(0,0,0,.45)'
	}
});


export default class RCTextInput extends React.PureComponent {
	static propTypes = {
		label: PropTypes.string,
		error: PropTypes.object,
		secureTextEntry: PropTypes.bool
	}
	static defaultProps = {
		showPassword: false,
		error: {}
	}
	state = {
		showPassword: false
	}

	get icon() { return <Icon name={this.state.showPassword ? 'eye-slash' : 'eye'} style={styles.icon} size={20} onPress={this.tooglePassword} />; }

	tooglePassword = () => this.setState({ showPassword: !this.state.showPassword })

	render() {
		const {
			label, error, secureTextEntry, ...inputProps
		} = this.props;
		const { showPassword } = this.state;
		return (
			<View style={styles.inputContainer}>
				{ label && <Text style={[styles.label, error.error && styles.labelError]}>{label}</Text> }
				<View style={styles.wrap}>
					<TextInput
						style={[styles.input, error.error && styles.inputError]}
						autoCorrect={false}
						autoCapitalize='none'
						underlineColorAndroid='transparent'
						secureTextEntry={secureTextEntry && !showPassword}
						{...inputProps}
					/>
					{secureTextEntry && this.icon}
				</View>
				{error.error && <Text style={sharedStyles.error}>{error.reason}</Text>}
			</View>
		);
	}
}
