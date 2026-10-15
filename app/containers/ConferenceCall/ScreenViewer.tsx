import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceControlButton, { COMPACT_BUTTON_SIZE } from './ConferenceControlButton';

interface IScreenViewer {
	video: ReactElement;
	label: string;
	onStop?: () => void;
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
	},
	stop: {
		position: 'absolute',
		top: 8,
		right: 8,
		zIndex: 1
	}
});

const ScreenViewer = ({ video, label, onStop }: IScreenViewer): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.viewer, { backgroundColor: colors.backdropColor }]} testID='conference-screen-viewer'>
			{video}
			<View style={[styles.plate, { backgroundColor: colors.overlayBackground }]}>
				<Text style={[styles.label, { color: colors.fontPureWhite }]} numberOfLines={1}>
					{label}
				</Text>
			</View>
			{onStop ? (
				<View style={styles.stop}>
					<ConferenceControlButton
						icon='close'
						label={I18n.t('Stop_sharing')}
						variant='danger'
						size={COMPACT_BUTTON_SIZE}
						onPress={onStop}
						testID='conference-stop-sharing'
					/>
				</View>
			) : null}
		</View>
	);
};

export default ScreenViewer;
