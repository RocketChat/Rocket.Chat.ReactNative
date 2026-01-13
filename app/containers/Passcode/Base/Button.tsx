import React from 'react';
import { Text, type StyleProp, type ViewStyle } from 'react-native';

import styles from './styles';
import Touch from '../../Touch';
import { CustomIcon, type TIconsName } from '../../CustomIcon';
import { useTheme } from '../../../theme';

interface IPasscodeButton {
	text?: string;
	icon?: TIconsName;
	disabled?: boolean;
	onPress?: Function;
	style?: StyleProp<ViewStyle>;
}

const Button = React.memo(({ style, text, disabled, onPress, icon }: IPasscodeButton) => {
	const { colors } = useTheme();

	const press = () => onPress && onPress(text);

	return (
		<Touch
			style={[styles.buttonView, { backgroundColor: 'transparent' }, style]}
			underlayColor={colors.buttonBackgroundSecondaryDefault}
			rippleColor={colors.buttonBackgroundSecondaryPress}
			enabled={!disabled}
			onPress={press}>
			{icon ? (
				<CustomIcon name={icon} size={36} />
			) : (
				<Text style={[styles.buttonText, { color: colors.fontDefault }]}>{text}</Text>
			)}
		</Touch>
	);
});

export default Button;
