import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput as RNTextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { BottomSheetTextInput } from '@discord/bottom-sheet';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import ActivityIndicator from '../ActivityIndicator';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { TextInput } from './TextInput';
import { isIOS } from '../../lib/methods/helpers';

const styles = StyleSheet.create({
	error: {
		...sharedStyles.textAlignCenter,
		paddingTop: 5
	},
	inputContainer: {
		marginBottom: 10,
		gap: 4
	},
	label: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textMedium
	},
	required: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	input: {
		...sharedStyles.textRegular,
		height: 48,
		fontSize: 16,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderWidth: 1,
		borderRadius: 4
	},
	inputIconLeft: {
		paddingLeft: 45
	},
	inputIconRight: {
		paddingRight: 45
	},
	wrap: {
		position: 'relative',
		justifyContent: 'center'
	},
	iconContainer: {
		position: 'absolute'
	},
	iconLeft: {
		left: 12
	},
	iconRight: {
		right: 12
	}
});

export interface IRCTextInputProps extends TextInputProps {
	label?: string;
	required?: boolean;
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
	required,
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
	accessibilityLabel,
	...inputProps
}: IRCTextInputProps): React.ReactElement => {
	const { colors } = useTheme();
	const [showPassword, setShowPassword] = useState(false);
	const showClearInput = onClearInput && value && value.length > 0;
	const Input = bottomSheet ? BottomSheetTextInput : TextInput;

	const accessibilityLabelRequired = required ? `, ${i18n.t('Required')}` : '';
	const accessibilityInputValue = (!secureTextEntry && value && isIOS) || showPassword ? `, ${value}` : '';
	return (
		<View
			accessible
			accessibilityLabel={`${label}${accessibilityLabelRequired}${accessibilityInputValue}`}
			style={[styles.inputContainer, containerStyle]}>
			{label ? (
				<Text style={[styles.label, { color: colors.fontTitlesLabels }, error?.error && { color: colors.fontDanger }]}>
					{label}{' '}
					{required && <Text style={[styles.required, { color: colors.fontSecondaryInfo }]}>{`(${i18n.t('Required')})`}</Text>}
				</Text>
			) : null}

			<View accessible style={styles.wrap}>
				<Input
					style={[
						styles.input,
						iconLeft && styles.inputIconLeft,
						(secureTextEntry || iconRight || showClearInput) && styles.inputIconRight,
						{
							backgroundColor: colors.surfaceRoom,
							borderColor: colors.strokeMedium,
							color: colors.fontTitlesLabels
						},
						error?.error && {
							color: colors.buttonBackgroundDangerDefault,
							borderColor: colors.buttonBackgroundDangerDefault
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
					placeholder={placeholder}
					value={value}
					placeholderTextColor={colors.fontAnnotation}
					{...inputProps}
				/>

				{iconLeft ? (
					<CustomIcon
						name={iconLeft}
						testID={testID ? `${testID}-icon-left` : undefined}
						size={20}
						color={colors.fontSecondaryInfo}
						style={[styles.iconContainer, styles.iconLeft]}
					/>
				) : null}

				{showClearInput ? (
					<Touchable onPress={onClearInput} style={[styles.iconContainer, styles.iconRight]} testID='clear-text-input'>
						<CustomIcon name='input-clear' size={20} color={colors.fontDefault} />
					</Touchable>
				) : null}

				{iconRight && !showClearInput ? (
					<CustomIcon
						name={iconRight}
						testID={testID ? `${testID}-icon-right` : undefined}
						size={20}
						color={colors.fontDefault}
						style={[styles.iconContainer, styles.iconRight]}
						accessible={false}
					/>
				) : null}

				{secureTextEntry ? (
					<Touchable
						style={[styles.iconContainer, styles.iconRight]}
						accessible
						accessibilityLabel={showPassword ? i18n.t('Hide_Password') : i18n.t('Show_Password')}
						onPress={() => setShowPassword(!showPassword)}>
						<CustomIcon
							name={showPassword ? 'unread-on-top' : 'unread-on-top-disabled'}
							testID={testID ? `${testID}-icon-password` : undefined}
							size={20}
							color={colors.fontDefault}
						/>
					</Touchable>
				) : null}

				{loading ? (
					<ActivityIndicator
						style={[styles.iconContainer, styles.iconRight]}
						color={colors.fontDefault}
						testID={testID ? `${testID}-loading` : undefined}
					/>
				) : null}
				{left}
			</View>
			{error && error.reason ? <Text style={[styles.error, { color: colors.fontDanger }]}>{error.reason}</Text> : null}
		</View>
	);
};
