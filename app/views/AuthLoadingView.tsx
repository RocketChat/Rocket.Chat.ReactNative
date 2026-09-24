import { memo, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from './Styles';
import { useAppSelector } from '../lib/hooks/useAppSelector';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		fontSize: 16,
		paddingTop: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const AuthLoadingView = memo((): ReactElement => {
	const text = useAppSelector(state => state.app.text);
	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
			{text ? (
				<>
					<ActivityIndicator color={colors.fontSecondaryInfo} size='large' />
					<PlainText style={[styles.text, { color: colors.fontDefault }]}>{`${text}\n${I18n.t('Please_wait')}`}</PlainText>
				</>
			) : null}
		</View>
	);
});

export default AuthLoadingView;
