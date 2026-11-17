import { type ComponentProps } from 'react';
import { Host, Image } from '@expo/ui/swift-ui';
import { font } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { type TIndicator } from './Indicator';

type TFont = Parameters<typeof font>[0];

const SYMBOLS: Record<TIndicator, { systemName: ComponentProps<typeof Image>['systemName']; font: TFont }> = {
	disclosure: { systemName: 'chevron.forward', font: { textStyle: 'footnote', weight: 'semibold' } },
	external: { systemName: 'arrow.up.forward', font: { textStyle: 'footnote', weight: 'semibold' } },
	check: { systemName: 'checkmark', font: { textStyle: 'body', weight: 'semibold' } }
};

const Indicator = ({ indicator }: { indicator: TIndicator }) => {
	const { colors } = useTheme();
	const symbol = SYMBOLS[indicator];

	return (
		<Host matchContents>
			<Image
				systemName={symbol.systemName}
				color={indicator === 'check' ? colors.badgeBackgroundLevel2 : colors.fontHint}
				modifiers={[font(symbol.font)]}
			/>
		</Host>
	);
};

export default Indicator;
