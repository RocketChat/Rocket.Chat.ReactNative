import React from 'react';
import {
	View, StyleSheet, Text, TextInput, ViewPropTypes, Image
} from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import sharedStyles from '../views/Styles';
import { COLOR_DANGER, COLOR_TEXT } from '../constants/colors';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 10
	},
	label: {
		marginBottom: 10,
		color: COLOR_TEXT,
		fontSize: 14,
		fontWeight: '700'
	},
	input: {
		...sharedStyles.textRegular,
		height: 48,
		fontSize: 17,
		color: '#9EA2A8',
		letterSpacing: 0,
		paddingLeft: 14,
		paddingRight: 14,
		borderWidth: 1.5,
		borderRadius: 2,
		backgroundColor: 'white',
		borderColor: '#E7EBF2'
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
		tintColor: '#2F343D',
		width: 20,
		height: 20
	},
	password: {
		tintColor: '#9ea2a8'
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
			<Image
				source={{ uri: iconLeft }}
				testID={testID ? `${ testID }-icon-left` : null}
				style={[styles.iconContainer, styles.iconLeft, styles.icon]}
			/>
		);
	}

	get iconPassword() {
		const { showPassword } = this.state;
		const { testID } = this.props;
		return (
			<BorderlessButton onPress={this.tooglePassword} style={[styles.iconContainer, styles.iconRight]}>
				<Image
					source={{ uri: showPassword ? 'eye' : 'eye_slash' }}
					testID={testID ? `${ testID }-icon-right` : null}
					style={[styles.icon, styles.password]}
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
						placeholderTextColor='#9ea2a8'
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
