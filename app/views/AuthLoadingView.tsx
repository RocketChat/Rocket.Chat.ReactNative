import { memo, type ReactElement } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from './Styles';
import { useAppSelector } from '../lib/hooks/useAppSelector';

const styles = StyleSheet.create(theme => ({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: theme.colors.surfaceRoom
	},
	text: {
		fontSize: 16,
		paddingTop: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		color: theme.colors.fontDefault
	}
}));

const AuthLoadingView = memo((): ReactElement => {
	const text = useAppSelector(state => state.app.text);
	const { colors } = useTheme();
	return (
		<View style={styles.container}>
			{text ? (
				<>
					<ActivityIndicator color={colors.fontSecondaryInfo} size='large' />
					<Text style={styles.text}>{`${text}\n${I18n.t('Please_wait')}`}</Text>
				</>
			) : null}
		</View>
	);
});

export default AuthLoadingView;
