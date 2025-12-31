import React from 'react';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import styles from './styles';
import RCActivityIndicator from '../ActivityIndicator';
import { AUDIO_BUTTON_HIT_SLOP } from './constants';
import { type TAudioState } from './types';
import getPlayButtonAccessibilityLabel from './getPlayButtonAccessibilityLabel';
import PressableOpacity from '../PressableOpacity';

interface IButton {
	disabled?: boolean;
	onPress: () => void;
	audioState: TAudioState;
}

type TCustomIconName = 'arrow-down' | 'play-shape-filled' | 'pause-shape-filled';

const Icon = ({ audioState, disabled }: { audioState: TAudioState; disabled: boolean }) => {
	const { colors } = useTheme();

	if (audioState === 'loading') {
		return <RCActivityIndicator size={24} color={colors.buttonFontPrimary} />;
	}

	let customIconName: TCustomIconName = 'arrow-down';
	if (audioState === 'playing') {
		customIconName = 'pause-shape-filled';
	}
	if (audioState === 'paused') {
		customIconName = 'play-shape-filled';
	}

	return (
		<CustomIcon
			name={customIconName}
			size={24}
			color={disabled ? colors.buttonBackgroundPrimaryDisabled : colors.buttonFontPrimary}
		/>
	);
};

const PlayButton = ({ onPress, disabled = false, audioState }: IButton): React.ReactElement => {
	const { colors } = useTheme();

	return (
		<PressableOpacity
			accessible
			accessibilityLabel={getPlayButtonAccessibilityLabel(audioState)}
			style={[styles.playPauseButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
			android_ripple={{
				color: colors.buttonBackgroundPrimaryPress
			}}
			disabled={disabled}
			onPress={onPress}
			hitSlop={AUDIO_BUTTON_HIT_SLOP}
			disableOpacityOnAndroid>
			<Icon audioState={audioState} disabled={disabled} />
		</PressableOpacity>
	);
};

export default PlayButton;
