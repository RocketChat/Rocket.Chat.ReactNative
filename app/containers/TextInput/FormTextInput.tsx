import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput as RNTextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import sharedStyles from '../../views/Styles';
import TextInput from './index';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { useTheme } from '../../theme';
import ActivityIndicator from '../ActivityIndicator';

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
	error?: any;
	loading?: boolean;
	containerStyle?: StyleProp<ViewStyle>;
	inputStyle?: StyleProp<TextStyle>;
	inputRef?: React.Ref<RNTextInput>;
	iconLeft?: TIconsName;
	iconRight?: TIconsName;
	left?: JSX.Element;
}

const FormTextInput = React.memo(
	({
		label,
		error,
		loading,
		containerStyle,
		inputStyle,
		inputRef,
		iconLeft,
		iconRight,
		left,
		testID,
		secureTextEntry,
		placeholder,
		...props
	}: IRCTextInputProps) => {
		const { colors, theme } = useTheme();
		const [showPassword, setShowPassword] = useState(false);

		const showIconLeft = () =>
			iconLeft ? (
				<CustomIcon
					name={iconLeft}
					testID={testID ? `${testID}-icon-left` : undefined}
					size={20}
					color={colors.bodyText}
					style={[styles.iconContainer, styles.iconLeft]}
				/>
			) : null;

		const showIconRight = () =>
			iconRight ? (
				<CustomIcon name={iconRight} size={20} color={colors.bodyText} style={[styles.iconContainer, styles.iconRight]} />
			) : null;

		const showIconPassword = () => (
			<Touchable onPress={() => setShowPassword(!showPassword)} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon
					name={showPassword ? 'unread-on-top' : 'unread-on-top-disabled'}
					testID={testID ? `${testID}-icon-right` : undefined}
					size={20}
					color={colors.auxiliaryText}
				/>
			</Touchable>
		);

		const showLoading = () => <ActivityIndicator style={[styles.iconContainer, styles.iconRight]} color={colors.bodyText} />;

		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{label ? (
					<Text style={[styles.label, { color: colors.titleText }, error?.error && { color: colors.dangerColor }]}>{label}</Text>
				) : null}

				<View style={styles.wrap}>
					<TextInput
						style={[
							styles.input,
							iconLeft && styles.inputIconLeft,
							(secureTextEntry || iconRight) && styles.inputIconRight,
							{
								backgroundColor: colors.backgroundColor,
								borderColor: colors.separatorColor,
								color: colors.titleText
							},
							error?.error && {
								color: colors.dangerColor,
								borderColor: colors.dangerColor
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
						{...props}
					/>
					{showIconLeft()}
					{showIconRight()}
					{secureTextEntry ? showIconPassword() : null}
					{loading ? showLoading() : null}
					{left}
				</View>
				{error && error.reason ? <Text style={[styles.error, { color: colors.dangerColor }]}>{error.reason}</Text> : null}
			</View>
		);
	}
);

export default FormTextInput;
