import { StyleSheet, type TextStyle } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	text: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24
	}
});

interface IAlertText {
	text: string;
	style?: TextStyle;
}

const AlertText = ({ text, style }: IAlertText) => {
	const { colors } = useTheme();
	return <PlainText style={[styles.text, { color: colors.fontDanger }, style]}>{text}</PlainText>;
};

export default AlertText;
