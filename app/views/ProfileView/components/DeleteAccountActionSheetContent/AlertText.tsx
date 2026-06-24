import { Text, type TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../Styles';

const styles = StyleSheet.create(theme => ({
	text: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		color: theme.colors.fontDanger
	}
}));

interface IAlertText {
	text: string;
	style?: TextStyle;
}

const AlertText = ({ text, style }: IAlertText) => {
	return <Text style={[styles.text, style]}>{text}</Text>;
};

export default AlertText;
