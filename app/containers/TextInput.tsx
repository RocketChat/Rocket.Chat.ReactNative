import React from 'react';
import { StyleProp, StyleSheet, Text, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import sharedStyles from '../views/Styles';
import TextInput from '../presentation/TextInput';
import { themes } from '../constants/colors';
import { CustomIcon } from '../lib/Icons';
import ActivityIndicator from './ActivityIndicator';

const styles = StyleSheet.create({
	error: {
		...sharedStyles.textAlignCenter,
		paddingTop: 5
	},
	inputContainer: {
		marginBottom: 10
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	input: {
		...sharedStyles.textRegular,
		height: 48,
		fontSize: 16,
		padding: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2
	},
	inputIconLeft: {
		paddingLeft: 45
	},
	inputIconRight: {
		paddingRight: 45
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
	}
});

export interface IRCTextInputProps extends TextInputProps {
	label?: string;
	error?: {
		error: any;
		reason: any;
	};
	loading?: boolean;
	containerStyle?: StyleProp<ViewStyle>;
	inputStyle?: StyleProp<TextStyle>;
	inputRef?: React.Ref<unknown>;
	testID?: string;
	iconLeft?: string;
	iconRight?: string;
	left?: JSX.Element;
	onIconRightPress?(): void;
	theme: string;
}

export default class RCTextInput extends React.PureComponent<IRCTextInputProps, any> {
	static defaultProps = {
		error: {},
		theme: 'light'
	};

	state = {
		showPassword: false
	};

	get iconLeft() {
		const { testID, iconLeft, theme } = this.props;
		return (
			<CustomIcon
				name={iconLeft}
				testID={testID ? `${testID}-icon-left` : null}
				style={[styles.iconContainer, styles.iconLeft, { color: themes[theme].bodyText }]}
				size={20}
			/>
		);
	}

	get iconRight() {
		const { iconRight, onIconRightPress, theme } = this.props;
		return (
			<Touchable onPress={onIconRightPress} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon name={iconRight} style={{ color: themes[theme].bodyText }} size={20} />
			</Touchable>
		);
	}

	get iconPassword() {
		const { showPassword } = this.state;
		const { testID, theme } = this.props;
		return (
			<Touchable onPress={this.tooglePassword} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon
					name={showPassword ? 'unread-on-top' : 'unread-on-top-disabled'}
					testID={testID ? `${testID}-icon-right` : null}
					style={{ color: themes[theme].auxiliaryText }}
					size={20}
				/>
			</Touchable>
		);
	}

	get loading() {
		const { theme } = this.props;
		// @ts-ignore
		return <ActivityIndicator style={[styles.iconContainer, styles.iconRight, { color: themes[theme].bodyText }]} />;
	}

	tooglePassword = () => {
		this.setState((prevState: any) => ({ showPassword: !prevState.showPassword }));
	};

	render() {
		const { showPassword } = this.state;
		const {
			label,
			left,
			error,
			loading,
			secureTextEntry,
			containerStyle,
			inputRef,
			iconLeft,
			iconRight,
			inputStyle,
			testID,
			placeholder,
			theme,
			...inputProps
		} = this.props;
		const { dangerColor } = themes[theme];
		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{label ? (
					<Text style={[styles.label, { color: themes[theme].titleText }, error?.error && { color: dangerColor }]}>{label}</Text>
				) : null}
				<View style={styles.wrap}>
					<TextInput
						style={[
							styles.input,
							iconLeft && styles.inputIconLeft,
							(secureTextEntry || iconRight) && styles.inputIconRight,
							{
								backgroundColor: themes[theme].backgroundColor,
								borderColor: themes[theme].separatorColor,
								color: themes[theme].titleText
							},
							error?.error && {
								color: dangerColor,
								borderColor: dangerColor
							},
							inputStyle
						]}
						ref={inputRef}
						autoCorrect={false}
						autoCapitalize='none'
						underlineColorAndroid='transparent'
						secureTextEntry={secureTextEntry && !showPassword}
						testID={testID}
						accessibilityLabel={placeholder}
						placeholder={placeholder}
						theme={theme}
						{...inputProps}
					/>
					{iconLeft ? this.iconLeft : null}
					{iconRight ? this.iconRight : null}
					{secureTextEntry ? this.iconPassword : null}
					{loading ? this.loading : null}
					{left}
				</View>
				{error && error.reason ? <Text style={[styles.error, { color: dangerColor }]}>{error.reason}</Text> : null}
			</View>
		);
	}
}
