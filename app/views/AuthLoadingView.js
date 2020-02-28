import React from 'react';
import {
	View, Text, StyleSheet, ActivityIndicator
} from 'react-native';

import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';

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

export default React.memo(withTheme(({ theme, navigation }) => {
	const text = navigation.getParam('text');
	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
			<StatusBar theme={theme} />
			{text && (
				<>
					<ActivityIndicator color={themes[theme].auxiliaryText} size='large' />
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{text}</Text>
				</>
			)}
		</View>
	);
}));
