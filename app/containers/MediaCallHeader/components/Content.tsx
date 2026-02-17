import { Pressable, StyleSheet, View } from 'react-native';

import Title from './Title';
import Subtitle from './Subtitle';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center'
	}
});

export const Content = () => (
	<Pressable onPress={() => alert('nav to call room')}>
		<View style={styles.container}>
			<Title />
			<Subtitle />
		</View>
	</Pressable>
);
