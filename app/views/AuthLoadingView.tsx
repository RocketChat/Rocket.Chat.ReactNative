import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { IApplicationState } from '../definitions';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { useTheme } from '../theme';
import { themes } from '../lib/constants';
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

interface IAuthLoadingView {
	text?: string;
}

const AuthLoadingView = React.memo(({ text }: IAuthLoadingView): React.ReactElement => {
	const { theme } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
			<StatusBar />
			{text ? (
				<>
					<ActivityIndicator color={themes[theme].auxiliaryText} size='large' />
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{`${text}\n${I18n.t('Please_wait')}`}</Text>
				</>
			) : null}
		</View>
	);
});

const mapStateToProps = (state: IApplicationState) => ({
	text: state.app.text
});

export default connect(mapStateToProps)(AuthLoadingView);
