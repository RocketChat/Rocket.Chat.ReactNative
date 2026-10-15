import { CameraView } from 'expo-camera';
import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceControlButton from './ConferenceControlButton';

interface IPreflightPreview {
	mic: boolean;
	cam: boolean;
	onToggleMic: () => void;
	onToggleCamera: () => void;
}

const styles = StyleSheet.create({
	preview: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: 8,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center'
	},
	placeholder: {
		alignItems: 'center',
		gap: 8,
		paddingBottom: 60
	},
	placeholderText: {
		...sharedStyles.textBold,
		fontSize: 14,
		lineHeight: 20
	},
	toggles: {
		position: 'absolute',
		bottom: 12,
		flexDirection: 'row',
		gap: 8
	}
});

const PreflightPreview = ({ mic, cam, onToggleMic, onToggleCamera }: IPreflightPreview): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.preview, { backgroundColor: colors.backdropColor }]}>
			{cam ? (
				<CameraView style={StyleSheet.absoluteFill} facing='front' testID='conference-preflight-preview' />
			) : (
				<View style={styles.placeholder}>
					<CustomIcon name='camera-disabled' size={32} color={colors.fontPureWhite} />
					<Text style={[styles.placeholderText, { color: colors.fontPureWhite }]}>{I18n.t('Your_camera_will_be_off')}</Text>
				</View>
			)}
			<View style={styles.toggles}>
				<ConferenceControlButton
					icon={mic ? 'mic' : 'mic-off'}
					label={mic ? I18n.t('Mute') : I18n.t('Unmute')}
					variant={mic ? 'default' : 'danger'}
					onPress={onToggleMic}
					testID='conference-preflight-mic'
				/>
				<ConferenceControlButton
					icon={cam ? 'video' : 'camera-disabled'}
					label={cam ? I18n.t('Stop_camera') : I18n.t('Start_camera')}
					variant={cam ? 'default' : 'danger'}
					onPress={onToggleCamera}
					testID='conference-preflight-camera'
				/>
			</View>
		</View>
	);
};

export default PreflightPreview;
