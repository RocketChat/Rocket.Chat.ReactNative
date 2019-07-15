import React from 'react';
import {
	StyleSheet, ActivityIndicator, View
} from 'react-native';
import { COLOR_TEXT } from '../../constants/colors';

const styles = StyleSheet.create({
	container: {
		height: '100%',
		width: '100%',
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center'
	}
});

const Loading = React.memo(() => (
	<View style={styles.container}>
		<ActivityIndicator size='large' color={COLOR_TEXT} />
	</View>
));

export default Loading;
