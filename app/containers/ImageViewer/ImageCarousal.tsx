import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ImageViewer } from './ImageViewer';

interface Data {
	id: number;
	uri: string;
}

interface ImageCarousalProps {
	data: Data[];
	firstIndex: number;
	width: number;
	height: number;
	onLoadEnd?: () => void;
}

const ImageCarousal = ({ data, firstIndex, width, height, ...props }: ImageCarousalProps): React.ReactElement => {
	const WIDTH_OFFSET = -width;

	const currItem = useSharedValue(firstIndex);
	const translateOuterX = useSharedValue(WIDTH_OFFSET * currItem.value);
	const offsetOuterX = useSharedValue(WIDTH_OFFSET * currItem.value);

	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: translateOuterX.value }]
	}));

	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={[{ width: data.length * width, height }]}>
				<Animated.View style={[{ flex: 1, flexDirection: 'row' }, style]}>
					{data.map(item => (
						<ImageViewer
							key={item.id}
							translateOuterX={translateOuterX}
							offsetOuterX={offsetOuterX}
							currItem={currItem}
							size={data.length}
							uri={item.uri}
							width={width}
							height={height}
							{...props}
						/>
					))}
				</Animated.View>
			</View>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	}
});

export default ImageCarousal;
