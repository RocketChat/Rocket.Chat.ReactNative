import { ImageBackground, StyleSheet } from 'react-native';

import { useTheme } from '../../../theme';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

const RoomBackground = () => {
	const { theme } = useTheme();
	return (
		<ImageBackground
			source={{ uri: `message_empty_${theme === 'dark' ? 'black' : theme}` }}
			style={styles.image}
			testID='room-view-empty'
		/>
	);
};

export default RoomBackground;
