import React from 'react';
import { StyleSheet, Image } from 'react-native';

import StatusBar from '../containers/StatusBar';
import { isAndroid } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%'
	}
});

export default React.memo(() => (
	<React.Fragment>
		<StatusBar />
		{isAndroid ? <Image source={{ uri: 'launch_screen' }} style={styles.image} /> : null}
	</React.Fragment>
));
