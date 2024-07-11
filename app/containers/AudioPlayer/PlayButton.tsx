import React from 'react';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import styles from './styles';
import RCActivityIndicator from '../ActivityIndicator';
import { AUDIO_BUTTON_HIT_SLOP } from './constants';
import { TAudioState } from './types';
import NativeButton from '../NativeButton';

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
		<NativeButton
			style={[styles.playPauseButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
			disabled={disabled}
			onPress={onPress}
			hitSlop={AUDIO_BUTTON_HIT_SLOP}>
			<Icon audioState={audioState} disabled={disabled} />
		</NativeButton>
	);
};

export default PlayButton;
