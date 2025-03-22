import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

export const EmptyRoom = React.memo(({ length, rid }: { length: number; rid: string }) => {
	const { theme } = useTheme();
	if (length === 0 || !rid) {
		return <ImageBackground source={{ uri: `message_empty_${theme}` }} style={styles.image} />;
	}
	return null;
});
