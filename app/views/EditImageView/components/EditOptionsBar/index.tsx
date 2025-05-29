import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import Touch from '../../../../containers/Touch';
import i18n from '../../../../i18n';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	touch: {
		padding: 4,
		borderRadius: 4
	}
});

interface IEditOptionsBarProps {
	loading: boolean;
	isCropping: boolean;
	onCancel: () => void;
	onCancelCrop: () => void;
	onContinue: () => void;
	crop: () => void;
	rotateLeft: () => void;
	rotateRight: () => void;
	startCrop: () => void;
	openAspectRatioOptions: () => void;
}

const EditOptionsBar = ({
	loading,
	isCropping,
	onCancel,
	rotateLeft,
	rotateRight,
	startCrop,
	openAspectRatioOptions,
	onContinue,
	crop,
	onCancelCrop
}: IEditOptionsBarProps) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const disabledStyle: StyleProp<ViewStyle> = { opacity: loading ? 0.4 : 1 };
	const hitSlop = { top: 15, bottom: 15, left: 15, right: 15 };

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceHover, paddingBottom: insets.bottom, paddingTop: 12 }]}>
			{isCropping ? (
				<>
					<Touch
						accessible
						accessibilityLabel={i18n.t('Cancel')}
						style={disabledStyle}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={onCancelCrop}>
						<Text style={{ color: colors.fontDefault }}>{i18n.t('Cancel')}</Text>
					</Touch>

					<Touch
						accessible
						accessibilityLabel={i18n.t('Crop')}
						style={disabledStyle}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={crop}>
						<Text style={{ color: colors.fontDefault }}>{i18n.t('Crop')}</Text>
					</Touch>
				</>
			) : (
				<>
					<Touch style={[styles.touch, disabledStyle]} enabled={!loading} hitSlop={hitSlop} onPress={onCancel}>
						<CustomIcon name='close' color={colors.fontDefault} size={24} />
					</Touch>

					<Touch
						accessible
						accessibilityLabel={i18n.t('Rotate_left')}
						style={[styles.touch, disabledStyle]}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={rotateLeft}>
						<CustomIcon name='undo' color={colors.fontDefault} size={24} />
					</Touch>

					<Touch
						accessible
						accessibilityLabel={i18n.t('Rotate_right')}
						style={[styles.touch, disabledStyle]}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={rotateRight}>
						<CustomIcon name='redo' color={colors.fontDefault} size={24} />
					</Touch>

					<Touch
						accessible
						accessibilityLabel={i18n.t('crop')}
						style={[styles.touch, disabledStyle]}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={startCrop}>
						<CustomIcon name='crop' color={colors.fontDefault} size={24} />
					</Touch>

					<Touch
						accessible
						accessibilityLabel={i18n.t('Change_aspect_ratio')}
						style={[styles.touch, disabledStyle]}
						enabled={!loading}
						hitSlop={hitSlop}
						onPress={openAspectRatioOptions}>
						<CustomIcon name='arrow-expand' color={colors.fontDefault} size={24} />
					</Touch>

					<Touch style={[styles.touch, disabledStyle]} enabled={!loading} hitSlop={hitSlop} onPress={onContinue}>
						<CustomIcon name='create' color={colors.fontDefault} size={24} />
					</Touch>
				</>
			)}
		</View>
	);
};

export default EditOptionsBar;
