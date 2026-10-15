import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import ConferenceControlButton, { CONTROL_ICON_SIZE } from './ConferenceControlButton';
import HandIcon from './HandIcon';

interface IConferenceControls {
	micEnabled: boolean;
	cameraEnabled: boolean;
	handRaised: boolean;
	onToggleMic: () => void;
	onToggleCamera: () => void;
	onMicOptions: () => void;
	onCameraOptions: () => void;
	onToggleHand: () => void;
	onReaction: () => void;
	onMore: () => void;
	onLeave: () => void;
}

const styles = StyleSheet.create({
	controls: {
		paddingHorizontal: 12,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderTopWidth: StyleSheet.hairlineWidth
	}
});

const ConferenceControls = ({
	micEnabled,
	cameraEnabled,
	handRaised,
	onToggleMic,
	onToggleCamera,
	onMicOptions,
	onCameraOptions,
	onToggleHand,
	onReaction,
	onMore,
	onLeave
}: IConferenceControls): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.controls, { borderTopColor: colors.strokeLight }]} testID='conference-controls'>
			<ConferenceControlButton
				icon={micEnabled ? 'mic' : 'mic-off'}
				label={micEnabled ? I18n.t('Mute') : I18n.t('Unmute')}
				variant={micEnabled ? 'default' : 'danger'}
				onPress={onToggleMic}
				onLongPress={onMicOptions}
				testID='conference-mic-button'
			/>
			<ConferenceControlButton
				icon={cameraEnabled ? 'video' : 'camera-disabled'}
				label={cameraEnabled ? I18n.t('Stop_camera') : I18n.t('Start_camera')}
				variant={cameraEnabled ? 'default' : 'danger'}
				onPress={onToggleCamera}
				onLongPress={onCameraOptions}
				testID='conference-camera-button'
			/>
			<ConferenceControlButton
				renderIcon={color => <HandIcon color={color} size={CONTROL_ICON_SIZE} />}
				label={handRaised ? I18n.t('Lower_hand') : I18n.t('Raise_hand')}
				variant={handRaised ? 'toggled' : 'default'}
				onPress={onToggleHand}
				testID='conference-hand-button'
			/>
			<ConferenceControlButton
				icon='emoji'
				label={I18n.t('Send_reaction')}
				onPress={onReaction}
				testID='conference-reaction-button'
			/>
			<ConferenceControlButton icon='kebab' label={I18n.t('More')} onPress={onMore} testID='conference-more-button' />
			<ConferenceControlButton
				icon='phone-off'
				label={I18n.t('Leave_call')}
				variant='danger'
				onPress={onLeave}
				testID='conference-leave-button'
			/>
		</View>
	);
};

export default ConferenceControls;
