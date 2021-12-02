import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

interface IEmptyRoomProps {
	length: number;
	mounted: boolean;
	theme: string;
	rid: string;
}

const EmptyRoom = React.memo(({ length, mounted, theme, rid }: IEmptyRoomProps) => {
	if ((length === 0 && mounted) || !rid) {
		return <ImageBackground source={{ uri: `message_empty_${theme}` }} style={styles.image} />;
	}
	return null;
});

export default EmptyRoom;
