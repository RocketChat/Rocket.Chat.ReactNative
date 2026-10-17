import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IScreenViewer {
	video: ReactElement;
	label: string;
}

const styles = StyleSheet.create({
	viewer: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center'
	},
	plate: {
		position: 'absolute',
		left: 8,
		bottom: 8,
		maxWidth: '80%',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4
	},
	label: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const ScreenViewer = ({ video, label }: IScreenViewer): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.viewer, { backgroundColor: colors.backdropColor }]} testID='conference-screen-viewer'>
			{video}
			<View style={[styles.plate, { backgroundColor: colors.overlayBackground }]}>
				<Text style={[styles.label, { color: colors.fontPureWhite }]} numberOfLines={1}>
					{label}
				</Text>
			</View>
		</View>
	);
};

export default ScreenViewer;
