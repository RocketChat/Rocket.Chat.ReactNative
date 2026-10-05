import { type TIconsName } from '~/containers/CustomIcon';

export interface IFloatingActionButton {
	icon: TIconsName;
	accessibilityLabel: string;
	testID: string;
	onPress: () => void;
}
