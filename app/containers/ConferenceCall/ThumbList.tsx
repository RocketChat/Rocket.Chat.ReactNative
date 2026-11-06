import { type ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { TILE_GAP_PX } from '~/lib/methods/helpers/pickTileGridLayout';
import { COLUMN_THUMB_WIDTH, STRIP_THUMB_WIDTH, type SpotlightOrientation } from '~/lib/methods/helpers/spotlightOrientation';

export type TThumb = { key: string; node: ReactElement; wide?: boolean };

interface IThumbList {
	thumbs: TThumb[];
	orientation: SpotlightOrientation;
	scrollEnabled: boolean;
}

export const STRIP_HEIGHT = 96;
export const SCREEN_THUMB_WIDTH = 200;

const styles = StyleSheet.create({
	strip: {
		height: STRIP_HEIGHT,
		flexGrow: 0
	},
	column: {
		width: COLUMN_THUMB_WIDTH,
		flexGrow: 0
	},
	separatorX: {
		width: TILE_GAP_PX
	},
	separatorY: {
		height: TILE_GAP_PX
	},
	columnItem: {
		width: '100%',
		aspectRatio: 16 / 9
	}
});

const ThumbList = ({ thumbs, orientation, scrollEnabled }: IThumbList): ReactElement => {
	const isStrip = orientation === 'stacked';

	return (
		<FlatList
			data={thumbs}
			horizontal={isStrip}
			scrollEnabled={scrollEnabled}
			keyExtractor={thumb => thumb.key}
			style={isStrip ? styles.strip : styles.column}
			ItemSeparatorComponent={() => <View style={isStrip ? styles.separatorX : styles.separatorY} />}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID='conference-thumbs'
			renderItem={({ item }) => (
				<View style={isStrip ? { width: item.wide ? SCREEN_THUMB_WIDTH : STRIP_THUMB_WIDTH, height: '100%' } : styles.columnItem}>
					{item.node}
				</View>
			)}
		/>
	);
};

export default ThumbList;
