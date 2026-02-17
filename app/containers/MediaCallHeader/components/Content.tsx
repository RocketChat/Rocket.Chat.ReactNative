import { Pressable, StyleSheet, View } from 'react-native';

import Title from './Title';
import Subtitle from './Subtitle';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		paddingHorizontal: 4
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'flex-start'
	}
});

export const Content = () => (
	<Pressable onPress={() => alert('nav to call room')} style={styles.button}>
		<View style={styles.container}>
			<Title />
			<Subtitle />
		</View>
	</Pressable>
);
