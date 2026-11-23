import { type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { useToastHost } from './useToastHost';

export { LISTENER } from './listener';

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
	const setToastHost = useToastHost();

	return (
		<EasyToast
			ref={setToastHost}
			position='center'
			style={[styles.toast, { backgroundColor: colors.surfaceDark }]}
			textStyle={[styles.text, { color: theme === 'light' ? colors.fontWhite : colors.fontPureBlack }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
