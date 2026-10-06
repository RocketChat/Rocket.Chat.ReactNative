import { Button, Text } from '@expo/ui/swift-ui';
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	buttonBorderShape,
	buttonStyle,
	font,
	foregroundStyle,
	id,
	tint
} from '@expo/ui/swift-ui/modifiers';

import { AVATAR_BORDER_RADIUS } from '~/containers/Avatar/constants';
import { useTheme } from '~/theme';
import { type ISectionPill } from './types';

const SectionPill = ({ header, title, selected, onSelect }: ISectionPill) => {
	const { colors } = useTheme();

	return (
		<Button
			onPress={() => onSelect(header, title)}
			modifiers={[
				buttonStyle(selected ? 'glassProminent' : 'glass'),
				buttonBorderShape('roundedRectangle', AVATAR_BORDER_RADIUS),
				tint(colors.buttonBackgroundPrimaryDefault),
				accessibilityAddTraits(selected ? ['isSelected'] : []),
				accessibilityIdentifier(`category-view-section-${header}`),
				id(header)
			]}>
			<Text
				modifiers={[
					font({ family: 'Inter', size: 16, weight: 'medium' }),
					foregroundStyle(selected ? colors.fontWhite : colors.fontDefault)
				]}>
				{title}
			</Text>
		</Button>
	);
};

export default SectionPill;
