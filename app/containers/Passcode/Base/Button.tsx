import { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { PlainText } from '~/containers/PlainText';

import styles from './styles';
import Touch from '~/containers/Touch';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';

interface IPasscodeButton {
	text?: string;
	icon?: TIconsName;
	disabled?: boolean;
	onPress?: Function;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

const Button = memo(({ style, text, disabled, onPress, icon, testID }: IPasscodeButton) => {
	const { colors } = useTheme();

	const press = () => onPress && onPress(text);

	return (
		<Touch
			testID={testID}
			style={[styles.buttonView, { backgroundColor: 'transparent' }, style]}
			underlayColor={colors.buttonBackgroundSecondaryDefault}
			rippleColor={colors.buttonBackgroundSecondaryPress}
			enabled={!disabled}
			onPress={press}>
			{icon ? (
				<CustomIcon name={icon} size={36} />
			) : (
				<PlainText style={[styles.buttonText, { color: colors.fontDefault }]}>{text}</PlainText>
			)}
		</Touch>
	);
});

export default Button;
