import React from 'react';
import { View, StyleSheet, Text, TextInput, ViewPropTypes, Platform } from 'react-native';
import PropTypes from 'prop-types';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import sharedStyles from '../views/Styles';
import { COLOR_DANGER, COLOR_TEXT } from '../constants/colors';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 15
	},
	label: {
		marginBottom: 10,
		color: COLOR_TEXT,
		fontSize: 14,
		fontWeight: '700'
	},
	input: {
		fontSize: 14,
		paddingTop: 12,
		paddingBottom: 12,
		// paddingTop: 5,
		// paddingBottom: 5,
		paddingHorizontal: 10,
		borderWidth: 2,
		borderRadius: 4,
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
		color: 'rgba(0,0,0,.45)',
		height: 45,
		textAlignVertical: 'center',
		...Platform.select({
			ios: {
				padding: 12
			},
			android: {
				paddingHorizontal: 12,
				paddingTop: 18,
				paddingBottom: 6
			}
		})
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

	icon = ({
		name,
		onPress,
		style,
		testID
	}) => <Icon name={name} style={[styles.icon, style]} size={20} onPress={onPress} testID={testID} />

	iconLeft = name => this.icon({
		name,
		onPress: null,
		style: { left: 0 },
		testID: this.props.testID ? `${ this.props.testID }-icon-left` : null
	});

	iconPassword = name => this.icon({
		name,
		onPress: () => this.tooglePassword(),
		style: { right: 0 },
		testID: this.props.testID ? `${ this.props.testID }-icon-right` : null
	});

	tooglePassword = () => this.setState({ showPassword: !this.state.showPassword });

	render() {
		const {
			label, error, secureTextEntry, containerStyle, inputRef, iconLeft, inputStyle, testID, placeholder, ...inputProps
		} = this.props;
		const { showPassword } = this.state;
		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{label ? <Text contentDescription={null} accessibilityLabel={null} style={[styles.label, error.error && styles.labelError]}>{label}</Text> : null }
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
						testID={testID}
						accessibilityLabel={placeholder}
						placeholder={placeholder}
						contentDescription={placeholder}
						{...inputProps}
					/>
					{iconLeft ? this.iconLeft(iconLeft) : null}
					{secureTextEntry ? this.iconPassword(showPassword ? 'eye-off' : 'eye') : null}
				</View>
				{error.error ? <Text style={sharedStyles.error}>{error.reason}</Text> : null}
			</View>
		);
	}
}
