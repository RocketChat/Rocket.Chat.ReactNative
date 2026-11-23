import { type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { registerToastHost } from './toastHosts';

export { LISTENER } from './toastHosts';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const Toast = (): ReactElement => {
	const { colors, theme } = useTheme();
	return (
		<EasyToast
			ref={registerToastHost}
			position='center'
			style={[styles.toast, { backgroundColor: colors.surfaceDark }]}
			textStyle={[styles.text, { color: theme === 'light' ? colors.fontWhite : colors.fontPureBlack }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
