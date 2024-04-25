import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

import EmptyPNG from '../../../../static/images/empty.png';

const styles = StyleSheet.create({
	image: {
		width: 300,
		height: 300,
		marginLeft: 'auto',
		marginRight: 'auto',
		alignSelf: 'center',
		marginTop: 190
	}
});

export const EmptyRoom = React.memo(({ length, rid }: { length: number; rid: string }) => {
	// const { theme } = useTheme();
	if (length === 0 || !rid) {
		return <ImageBackground source={EmptyPNG} style={styles.image} />;
	}
	return null;
});
