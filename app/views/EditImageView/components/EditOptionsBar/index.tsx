import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '../../../../containers/CustomIcon';
import Touch from '../../../../containers/Touch';
import { useTheme } from '../../../../theme';
import RCActivityIndicator from '../../../../containers/ActivityIndicator';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		alignItems: 'center',
		justifyContent: 'space-between'
	}
});

interface IEditOptionsBarProps {
	loading: { icon: string; loading: boolean };
	isCropping: boolean;
	onCancel: () => void;
	onCancelCrop: () => void;
	onContinue: () => void;
	crop: () => void;
	rotateLeft: () => void;
	rotateRight: () => void;
	startCrop: () => void;
	openResizeOptions: () => void;
}

const EditOptionsBar = ({
	loading,
	isCropping,
	onCancel,
	rotateLeft,
	rotateRight,
	startCrop,
	openResizeOptions,
	onContinue,
	crop,
	onCancelCrop
}: IEditOptionsBarProps) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceHover, paddingBottom: insets.bottom, paddingTop: 12 }]}>
			{isCropping ? (
				<>
					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onCancelCrop}>
						<Text style={{ color: colors.fontDefault }}>Cancel</Text>
					</Touch>

					<Touch style={{ opacity: loading ? 0.4 : 1 }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={crop}>
						<Text style={{ color: colors.fontDefault }}>Crop</Text>
					</Touch>
				</>
			) : (
				<>
					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onCancel}>
						<Text style={{ color: colors.fontDefault }}>Cancel</Text>
					</Touch>

					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={rotateLeft}>
						{loading.icon === 'rotateLeft' && loading.loading ? (
							<RCActivityIndicator size={24} />
						) : (
							<CustomIcon name='undo' size={24} />
						)}
					</Touch>

					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={rotateRight}>
						<CustomIcon name='redo' size={24} />
					</Touch>

					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={startCrop}>
						<CustomIcon name='crop' size={24} />
					</Touch>

					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={openResizeOptions}>
						<CustomIcon name='arrow-expand' size={24} />
					</Touch>

					<Touch enabled={!loading.loading} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onContinue}>
						<Text style={{ color: colors.fontDefault }}>Continue</Text>
					</Touch>
				</>
			)}
		</View>
	);
};

export default EditOptionsBar;
