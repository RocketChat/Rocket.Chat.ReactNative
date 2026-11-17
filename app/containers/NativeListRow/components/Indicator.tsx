import { I18nManager } from 'react-native';

import ListIcon from '~/containers/List/components/ListIcon';

export type TIndicator = 'disclosure' | 'external' | 'check';

const ICONS = {
	disclosure: 'chevron-right',
	external: 'new-window',
	check: 'check'
} as const;

const Indicator = ({ indicator }: { indicator: TIndicator }) => (
	<ListIcon
		name={ICONS[indicator]}
		style={indicator === 'disclosure' && I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : undefined}
	/>
);

export default Indicator;
