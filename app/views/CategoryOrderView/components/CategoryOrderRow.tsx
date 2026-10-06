import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';

import { CONTENT_SPACING, ROW_PADDING_HORIZONTAL } from '~/containers/NativeListRow/constants';
import { useTheme } from '~/theme';
import { useCategoryOrderRowHeight } from '../hooks/useCategoryOrderRowHeight';
import DragHandle, { DRAG_HANDLE_SIZE } from './DragHandle';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: CONTENT_SPACING,
		paddingHorizontal: ROW_PADDING_HORIZONTAL
	},
	title: {
		flex: 1,
		fontSize: 17,
		fontWeight: '500'
	},
	separator: {
		position: 'absolute',
		left: ROW_PADDING_HORIZONTAL + DRAG_HANDLE_SIZE + CONTENT_SPACING,
		right: 0,
		bottom: 0,
		height: StyleSheet.hairlineWidth
	}
});

interface ICategoryOrderRow {
	title: string;
	disabled?: boolean;
	dragGesture?: PanGesture;
	showSeparator?: boolean;
}

const CategoryOrderRow = ({ title, disabled = false, dragGesture, showSeparator = false }: ICategoryOrderRow) => {
	const { colors } = useTheme();
	const height = useCategoryOrderRowHeight();
	return (
		<View style={[styles.row, { height, backgroundColor: colors.surfaceLight }]}>
			{dragGesture ? (
				<GestureDetector gesture={dragGesture}>
					<View>
						<DragHandle color={colors.fontSecondaryInfo} />
					</View>
				</GestureDetector>
			) : (
				<DragHandle color={disabled ? colors.fontDisabled : colors.fontSecondaryInfo} />
			)}
			<Text style={[styles.title, { color: disabled ? colors.fontDisabled : colors.fontDefault }]} numberOfLines={1}>
				{title}
			</Text>
			{showSeparator ? <View style={[styles.separator, { backgroundColor: colors.strokeLight }]} /> : null}
		</View>
	);
};

export default CategoryOrderRow;
