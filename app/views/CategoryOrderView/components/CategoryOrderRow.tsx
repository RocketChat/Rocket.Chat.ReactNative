import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';

import { CustomIcon } from '~/containers/CustomIcon';
import { CONTENT_SPACING, ROW_PADDING_HORIZONTAL } from '~/containers/NativeListRow/constants';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useTheme } from '~/theme';
import { useNativeListRowHeight } from '~/containers/NativeListRow/hooks/useNativeListRowHeight';

const DRAG_HANDLE_SIZE = 24;

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
	const height = useNativeListRowHeight();
	const { fontScaleLimited } = useResponsiveLayout();
	const separatorInset = ROW_PADDING_HORIZONTAL + DRAG_HANDLE_SIZE * fontScaleLimited + CONTENT_SPACING;
	return (
		<View style={[styles.row, { height, backgroundColor: colors.surfaceLight }]}>
			{dragGesture ? (
				<GestureDetector gesture={dragGesture}>
					<View>
						<CustomIcon name='stacked-meatballs' size={DRAG_HANDLE_SIZE} color={colors.fontSecondaryInfo} />
					</View>
				</GestureDetector>
			) : (
				<CustomIcon
					name='stacked-meatballs'
					size={DRAG_HANDLE_SIZE}
					color={disabled ? colors.fontDisabled : colors.fontSecondaryInfo}
				/>
			)}
			<Text style={[styles.title, { color: disabled ? colors.fontDisabled : colors.fontDefault }]} numberOfLines={1}>
				{title}
			</Text>
			{showSeparator ? <View style={[styles.separator, { left: separatorInset, backgroundColor: colors.strokeLight }]} /> : null}
		</View>
	);
};

export default CategoryOrderRow;
