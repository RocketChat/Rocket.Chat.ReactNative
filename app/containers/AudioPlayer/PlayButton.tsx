import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import styles from './styles';
import RCActivityIndicator from '../ActivityIndicator';
import { AUDIO_BUTTON_HIT_SLOP } from './constants';

interface IButton {
	disabled?: boolean;
	onPress: () => void;
	audioState: TAudioState;
}

type TCustomIconName = 'arrow-down' | 'play-shape-filled' | 'pause-shape-filled';

export type TAudioState = 'loading' | 'paused' | 'to-download' | 'playing';

const IconToRender = ({ audioState, disabled }: { audioState: TAudioState; disabled: boolean }) => {
	const { colors } = useTheme();

	if (audioState === 'loading') {
		return <RCActivityIndicator />;
	}

	let customIconName: TCustomIconName = 'arrow-down';
	if (audioState === 'playing') {
		customIconName = 'pause-shape-filled';
	}
	if (audioState === 'paused') {
		customIconName = 'play-shape-filled';
	}

	return <CustomIcon name={customIconName} size={24} color={disabled ? colors.tintDisabled : colors.buttonFontPrimary} />;
};

const PlayButton = ({ onPress, disabled = false, audioState }: IButton) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			style={[styles.playPauseButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
			disabled={disabled}
			onPress={onPress}
			hitSlop={AUDIO_BUTTON_HIT_SLOP}
		>
			<IconToRender audioState={audioState} disabled={disabled} />
		</TouchableOpacity>
	);
};

export default PlayButton;
