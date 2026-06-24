import { BorderlessButton } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../../../../i18n';
import { CustomIcon, type TIconsName } from '../../../CustomIcon';
import { useMessageComposerApi } from '../../context';

export interface IBaseButton {
	testID: string;
	accessibilityLabel: string;
	icon: TIconsName;
	color?: string;
	onPress(): void;
}

export const hitSlop = {
	top: 10,
	right: 10,
	bottom: 10,
	left: 10
};

export const BaseButton = ({ accessibilityLabel, icon, color, testID, onPress }: IBaseButton) => {
	'use memo';

	const { setFocused } = useMessageComposerApi();

	return (
		<BorderlessButton style={styles.button} onPress={() => onPress()} hitSlop={hitSlop}>
			<View
				accessible
				accessibilityLabel={I18n.t(accessibilityLabel)}
				accessibilityRole='button'
				collapsable={false}
				testID={testID}
				onFocus={() => setFocused(true)}>
				<CustomIcon name={icon} size={24} color={color} />
			</View>
		</BorderlessButton>
	);
};

const styles = StyleSheet.create((_theme, rt) => ({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 24 * rt.fontScale,
		height: 24 * rt.fontScale
	}
}));
