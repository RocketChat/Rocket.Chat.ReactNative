import { type ComponentProps } from 'react';
import { Image } from '@expo/ui/swift-ui';
import { font } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';

export type TNativeListIndicator = 'disclosure' | 'external';

const SYSTEM_NAMES: Record<TNativeListIndicator, ComponentProps<typeof Image>['systemName']> = {
	disclosure: 'chevron.forward',
	external: 'arrow.up.forward'
};

const NativeListIndicator = ({ indicator }: { indicator: TNativeListIndicator }) => {
	const { colors } = useTheme();

	return (
		<Image
			systemName={SYSTEM_NAMES[indicator]}
			color={colors.fontHint}
			modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}
		/>
	);
};

export default NativeListIndicator;
