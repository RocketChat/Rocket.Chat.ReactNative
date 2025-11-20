import React from 'react';
import { ImageBackground } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

const EmptyRoom = React.memo(({ length, rid }: { length: number; rid: string }) => {
	const { theme } = useTheme();
	if (length === 0 || !rid) {
		return <ImageBackground source={{ uri: `message_empty_${theme === 'dark' ? 'black' : theme}` }} style={styles.image} />;
	}
	return null;
});

export default EmptyRoom;
