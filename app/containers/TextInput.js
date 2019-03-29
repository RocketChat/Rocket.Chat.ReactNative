import React from 'react';
import {
	View, StyleSheet, Text, TextInput, ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import sharedStyles from '../views/Styles';
import {
	COLOR_DANGER, COLOR_TEXT_DESCRIPTION, COLOR_TEXT, COLOR_BORDER
} from '../constants/colors';
import { CustomIcon } from '../lib/Icons';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 10
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold,
		...sharedStyles.textColorNormal
	},
	input: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		height: 48,
		fontSize: 16,
		paddingLeft: 14,
		paddingRight: 14,
		borderWidth: 1,
		borderRadius: 2,
		backgroundColor: 'white',
		borderColor: COLOR_BORDER
	},
	inputIconLeft: {
		paddingLeft: 45
	},
	inputIconRight: {
		paddingRight: 45
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
	iconContainer: {
		position: 'absolute',
		top: 14
	},
	iconLeft: {
		left: 15
	},
	iconRight: {
		right: 15
	},
	icon: {
		color: COLOR_TEXT
	},
	password: {
		color: COLOR_TEXT_DESCRIPTION
	}
});


export default class RCTextInput extends React.PureComponent {
	static propTypes = {
		label: PropTypes.string,
		error: PropTypes.object,
		secureTextEntry: PropTypes.bool,
		containerStyle: ViewPropTypes.style,
		inputStyle: PropTypes.object,
		inputRef: PropTypes.func,
		testID: PropTypes.string,
		iconLeft: PropTypes.string,
		placeholder: PropTypes.string
	}

	static defaultProps = {
		error: {}
	}

	state = {
		showPassword: false
	}

	get iconLeft() {
		const { testID, iconLeft } = this.props;
		return (
			<CustomIcon
				name={iconLeft}
				testID={testID ? `${ testID }-icon-left` : null}
				style={[styles.iconContainer, styles.iconLeft, styles.icon]}
				size={20}
			/>
		);
	}

	get iconPassword() {
		const { showPassword } = this.state;
		const { testID } = this.props;
		return (
			<BorderlessButton onPress={this.tooglePassword} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon
					name={showPassword ? 'Eye' : 'eye-off'}
					testID={testID ? `${ testID }-icon-right` : null}
					style={[styles.icon, styles.password]}
					size={20}
				/>
			</BorderlessButton>
		);
	}

	tooglePassword = () => {
		this.setState(prevState => ({ showPassword: !prevState.showPassword }));
	}

	render() {
		const { showPassword } = this.state;
		const {
			label, error, secureTextEntry, containerStyle, inputRef, iconLeft, inputStyle, testID, placeholder, ...inputProps
		} = this.props;
		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{label ? <Text contentDescription={null} accessibilityLabel={null} style={[styles.label, error.error && styles.labelError]}>{label}</Text> : null}
				<View style={styles.wrap}>
					<TextInput
						style={[
							styles.input,
							error.error && styles.inputError,
							inputStyle,
							iconLeft && styles.inputIconLeft,
							secureTextEntry && styles.inputIconRight
						]}
						ref={inputRef}
						autoCorrect={false}
						autoCapitalize='none'
						underlineColorAndroid='transparent'
						secureTextEntry={secureTextEntry && !showPassword}
						testID={testID}
						accessibilityLabel={placeholder}
						placeholder={placeholder}
						placeholderTextColor={COLOR_TEXT_DESCRIPTION}
						contentDescription={placeholder}
						{...inputProps}
					/>
					{iconLeft ? this.iconLeft : null}
					{secureTextEntry ? this.iconPassword : null}
				</View>
				{error.error ? <Text style={sharedStyles.error}>{error.reason}</Text> : null}
			</View>
		);
	}
}
