import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export default React.memo(() => (
	<View style={styles.container}>
		<Image source={require('../static/images/logo.png')} resizeMode='center' />
	</View>
));
