import React from 'react';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon, ICustomIcon } from '../CustomIcon';
import styles from './styles';

const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;

interface IActionButtonProps {
	iconName: ICustomIcon['name'];
	iconColor: ICustomIcon['color'];
	backgroundColor: string;
	isCondensed: boolean;
	enabled: boolean;
	onPress: () => void;
}

function ActionButton({ enabled, onPress, iconName, backgroundColor, isCondensed, iconColor }: IActionButtonProps) {
	return (
		<RectButton enabled={enabled} onPress={onPress} style={[styles.actionButton, { backgroundColor }]}>
			<CustomIcon size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE} name={iconName} color={iconColor} />
		</RectButton>
	);
}

export default React.memo(ActionButton);
