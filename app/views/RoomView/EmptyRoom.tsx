import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

const EmptyRoom = React.memo(({ length, mounted, rid }: { length: number; mounted: boolean; rid: string }) => {
	const { theme } = useTheme();
	if ((length === 0 && mounted) || !rid) {
		return <ImageBackground source={{ uri: `message_empty_${theme}` }} style={styles.image} />;
	}
	return null;
});

export default EmptyRoom;
