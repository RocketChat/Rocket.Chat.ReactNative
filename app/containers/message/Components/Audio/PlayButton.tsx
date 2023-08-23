import React from 'react';

import Touchable from '../../Touchable';
import { CustomIcon } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';
import styles from './styles';
import Loading from './Loading';

interface IButton {
	loading: boolean;
	paused: boolean;
	disabled?: boolean;
	onPress: () => void;
	cached: boolean;
}

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

type TCustomIconName = 'arrow-down' | 'play-shape-filled' | 'pause-shape-filled';

const PlayButton = React.memo(({ loading, paused, onPress, disabled, cached }: IButton) => {
	const { colors } = useTheme();

	let customIconName: TCustomIconName = 'arrow-down';
	if (cached) {
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
				<Loading />
			) : (
				<CustomIcon name={customIconName} size={24} color={disabled ? colors.tintDisabled : colors.buttonFontOnPrimary} />
			)}
		</Touchable>
	);
});

export default PlayButton;
