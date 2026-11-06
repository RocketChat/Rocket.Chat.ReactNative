import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IScreenShareThumb {
	video: ReactElement;
	label: string;
	onSpotlight: () => void;
	testID?: string;
}

const styles = StyleSheet.create({
	thumb: {
		flex: 1,
		borderRadius: 8,
		borderWidth: 1,
		overflow: 'hidden'
	},
	plate: {
		position: 'absolute',
		left: 4,
		bottom: 4,
		maxWidth: '90%',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4
	},
	label: {
		...sharedStyles.textRegular,
		fontSize: 11,
		lineHeight: 14
	}
});

const ScreenShareThumb = ({ video, label, onSpotlight, testID }: IScreenShareThumb): ReactElement => {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onSpotlight}
			accessibilityRole='button'
			accessibilityLabel={`${I18n.t('Spotlight_this_screen')}, ${label}`}
			testID={testID}
			style={[styles.thumb, { backgroundColor: colors.backdropColor, borderColor: colors.strokeMedium }]}>
			{video}
			<View style={[styles.plate, { backgroundColor: colors.overlayBackground }]}>
				<Text style={[styles.label, { color: colors.fontPureWhite }]} numberOfLines={1}>
					{label}
				</Text>
			</View>
		</Pressable>
	);
};

export default ScreenShareThumb;
