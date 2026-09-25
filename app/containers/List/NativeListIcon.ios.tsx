import { Text } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';

import { type TIconsName } from '../CustomIcon';
import { mappedIcons } from '../CustomIcon/mappedIcons';
import { ICON_SIZE } from './constants';

interface INativeListIcon {
	name: TIconsName;
	color: string;
	size?: number;
}

const ICON_FONT_FAMILY = 'custom';

const NativeListIcon = ({ name, color, size = ICON_SIZE }: INativeListIcon) => (
	<Text modifiers={[font({ family: ICON_FONT_FAMILY, size, textStyle: 'body' }), foregroundStyle(color)]}>
		{String.fromCodePoint(mappedIcons[name])}
	</Text>
);

export default NativeListIcon;
