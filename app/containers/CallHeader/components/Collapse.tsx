import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import * as HeaderButton from '../../Header/components/HeaderButton';

const Collapse = () => {
	const { colors } = useTheme();
	const focused = useCallStore(state => state.focused);
	const toggleFocus = useCallStore(state => state.toggleFocus);
	return (
		<HeaderButton.Container left>
			<HeaderButton.Item
				accessibilityLabel={I18n.t('Minimize')}
				onPress={toggleFocus}
				iconName={focused ? 'arrow-collapse' : 'arrow-expand'}
				color={colors.fontDefault}
			/>
		</HeaderButton.Container>
	);
};

export default Collapse;
