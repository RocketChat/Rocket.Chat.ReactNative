import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput as RNTextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { TextInput } from './TextInput';

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
	bottomSheet?: boolean;
	onClearInput?: () => void;
}

export const FormTextInput = ({
	label,
	error,
	loading,
	containerStyle,
	inputStyle,
	inputRef,
	iconLeft,
	iconRight,
	onClearInput,
	value,
	left,
	testID,
	secureTextEntry,
	bottomSheet,
	placeholder,
	...inputProps
}: IRCTextInputProps): React.ReactElement => {
	const { colors } = useTheme();
	const [showPassword, setShowPassword] = useState(false);
	const showClearInput = onClearInput && value && value.length > 0;
	const Input = bottomSheet ? BottomSheetTextInput : TextInput;
	return (
		<View style={[styles.inputContainer, containerStyle]}>
			{label ? (
				<Text style={[styles.label, { color: colors.titleText }, error?.error && { color: colors.dangerColor }]}>{label}</Text>
			) : null}

			<View style={styles.wrap}>
				<Input
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
					// @ts-ignore ref error
					ref={inputRef}
					autoCorrect={false}
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					secureTextEntry={secureTextEntry && !showPassword}
					testID={testID}
					accessibilityLabel={placeholder}
					placeholder={placeholder}
					value={value}
					{...inputProps}
				/>

				{iconLeft ? (
					<CustomIcon
						name={iconLeft}
						testID={testID ? `${testID}-icon-left` : undefined}
						size={20}
						color={colors.auxiliaryText}
						style={[styles.iconContainer, styles.iconLeft]}
					/>
				) : null}

				{showClearInput ? (
					<Touchable onPress={onClearInput} style={[styles.iconContainer, styles.iconRight]} testID='clear-text-input'>
						<CustomIcon name='input-clear' size={20} color={colors.auxiliaryTintColor} />
					</Touchable>
				) : null}

				{iconRight && !showClearInput ? (
					<CustomIcon
						name={iconRight}
						testID={testID ? `${testID}-icon-right` : undefined}
						size={20}
						color={colors.bodyText}
						style={[styles.iconContainer, styles.iconRight]}
					/>
				) : null}

				{secureTextEntry ? (
					<Touchable onPress={() => setShowPassword(!showPassword)} style={[styles.iconContainer, styles.iconRight]}>
						<CustomIcon
							name={showPassword ? 'unread-on-top' : 'unread-on-top-disabled'}
							testID={testID ? `${testID}-icon-password` : undefined}
							size={20}
							color={colors.auxiliaryText}
						/>
					</Touchable>
				) : null}

				{loading ? (
					<ActivityIndicator
						style={[styles.iconContainer, styles.iconRight]}
						color={colors.bodyText}
						testID={testID ? `${testID}-loading` : undefined}
					/>
				) : null}
				{left}
			</View>
			{error && error.reason ? <Text style={[styles.error, { color: colors.dangerColor }]}>{error.reason}</Text> : null}
		</View>
	);
};
