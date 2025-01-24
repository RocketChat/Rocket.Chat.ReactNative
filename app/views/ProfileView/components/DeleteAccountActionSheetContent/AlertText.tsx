import { StyleSheet, Text, TextStyle } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../Styles';

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
	return <Text style={[styles.text, { color: colors.fontDanger }, style]}>{text}</Text>;
};

export default AlertText;
