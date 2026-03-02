import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from './Styles';
import { useAppSelector } from '../lib/hooks/useAppSelector';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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

const AuthLoadingView = React.memo((): React.ReactElement => {
	const text = useAppSelector(state => state.app.text);
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
			{text ? (
				<>
					<ActivityIndicator color={colors.fontSecondaryInfo} size='large' />
					<Text style={[styles.text, { color: colors.fontDefault, fontSize: scaleFontSize(16) }]}>{`${text}\n${I18n.t('Please_wait')}`}</Text>
				</>
			) : null}
		</View>
	);
});

export default AuthLoadingView;
