import { Button, Image, Label } from '@expo/ui/swift-ui';
import { disabled } from '@expo/ui/swift-ui/modifiers';

import { type TIconsName } from '../CustomIcon';
import { useTheme } from '~/theme';
import { useIconImageUri } from './useIconImageUri';

const ICON_SIZE = 24;

interface IContextMenuButton {
	title: string;
	icon?: TIconsName;
	onPress: () => void;
	testID?: string;
	danger?: boolean;
	enabled?: boolean;
}

const ContextMenuButton = ({ title, icon, onPress, testID, danger, enabled = true }: IContextMenuButton) => {
	const { colors } = useTheme();
	const iconUri = useIconImageUri(icon, ICON_SIZE, danger ? colors.fontDanger : colors.fontDefault);

	return (
		<Button testID={testID} role={danger ? 'destructive' : 'default'} onPress={onPress} modifiers={[disabled(!enabled)]}>
			<Label title={title} icon={iconUri ? <Image uiImage={iconUri} /> : undefined} />
		</Button>
	);
};

export default ContextMenuButton;
