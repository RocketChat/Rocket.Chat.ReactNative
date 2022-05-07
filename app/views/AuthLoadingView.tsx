import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { IApplicationState } from '../definitions';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { useTheme } from '../theme';
import sharedStyles from './Styles';

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
	const text = useSelector((state: IApplicationState) => state.app.text);
	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
			<StatusBar />
			{text ? (
				<>
					<ActivityIndicator color={colors.auxiliaryText} size='large' />
					<Text style={[styles.text, { color: colors.bodyText }]}>{`${text}\n${I18n.t('Please_wait')}`}</Text>
				</>
			) : null}
		</View>
	);
});

export default AuthLoadingView;
