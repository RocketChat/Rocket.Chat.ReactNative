import React from 'react';
import { View, StyleSheet, Text, TextInput, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';

import Icon from 'react-native-vector-icons/FontAwesome';

import sharedStyles from '../views/Styles';
import { COLOR_DANGER, COLOR_TEXT } from '../constants/colors';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 20
	},
	label: {
		marginBottom: 4,
		fontSize: 16,
		color: COLOR_TEXT
	},
	input: {
		// height: 45,
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
		position: 'relative'
	},
	icon: {
		position: 'absolute',
		padding: 10,
		color: 'rgba(0,0,0,.45)',
		height: 45,
		textAlignVertical: 'center'
	}
});


export default class RCTextInput extends React.PureComponent {
	static propTypes = {
		label: PropTypes.string,
		error: PropTypes.object,
		secureTextEntry: PropTypes.bool,
		containerStyle: ViewPropTypes.style,
		inputStyle: PropTypes.object,
		inputRef: PropTypes.func
	}
	static defaultProps = {
		error: {}
	}
	state = {
		showPassword: false
	}

	icon = ({ name, onPress, style }) => <Icon name={name} style={[styles.icon, style]} size={20} onPress={onPress} />

	iconLeft = name => this.icon({ name, onPress: () => {}, style: { left: 0 } });

	iconPassword = name => this.icon({ name, onPress: () => this.tooglePassword(), style: { right: 0 } });

	tooglePassword = () => this.setState({ showPassword: !this.state.showPassword });

	render() {
		const {
			label, error, secureTextEntry, containerStyle, inputRef, iconLeft, inputStyle, ...inputProps
		} = this.props;
		const { showPassword } = this.state;
		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{ label && <Text style={[styles.label, error.error && styles.labelError]}>{label}</Text> }
				<View style={styles.wrap}>
					<TextInput
						style={[
							styles.input,
							error.error && styles.inputError,
							inputStyle,
							iconLeft && { paddingLeft: 40 },
							secureTextEntry && { paddingRight: 40 }
						]}
						ref={inputRef}
						autoCorrect={false}
						autoCapitalize='none'
						underlineColorAndroid='transparent'
						secureTextEntry={secureTextEntry && !showPassword}
						{...inputProps}
					/>
					{iconLeft && this.iconLeft(iconLeft)}
					{secureTextEntry && this.iconPassword(showPassword ? 'eye-slash' : 'eye')}
				</View>
				{error.error && <Text style={sharedStyles.error}>{error.reason}</Text>}
			</View>
		);
	}
}
