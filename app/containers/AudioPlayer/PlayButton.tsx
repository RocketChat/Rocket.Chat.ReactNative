import React from 'react';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import styles from './styles';
import RCActivityIndicator from '../ActivityIndicator';

interface IButton {
	loading: boolean;
	paused: boolean;
	disabled?: boolean;
	onPress: () => void;
	isReadyToPlay: boolean;
}

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

type TCustomIconName = 'arrow-down' | 'play-shape-filled' | 'pause-shape-filled';

const PlayButton = React.memo(({ loading, paused, onPress, disabled, isReadyToPlay }: IButton) => {
	const { colors } = useTheme();

	let customIconName: TCustomIconName = 'arrow-down';
	if (isReadyToPlay) {
		customIconName = paused ? 'play-shape-filled' : 'pause-shape-filled';
	}
	return (
		<Touchable
			style={[styles.playPauseButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
			disabled={disabled}
			onPress={onPress}
			hitSlop={BUTTON_HIT_SLOP}
			background={Touchable.SelectableBackgroundBorderless()}
		>
			{loading ? (
				<RCActivityIndicator />
			) : (
				<CustomIcon name={customIconName} size={24} color={disabled ? colors.tintDisabled : colors.buttonFontPrimary} />
			)}
		</Touchable>
	);
});

export default PlayButton;
