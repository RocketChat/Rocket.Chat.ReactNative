import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import * as HeaderButton from '../../Header/components/HeaderButton';

const EndCall = () => {
	'use memo';

	const { colors } = useTheme();
	const endCall = useCallStore(state => state.endCall);
	return (
		<HeaderButton.Container>
			<HeaderButton.Item
				testID='media-call-header-end'
				accessibilityLabel={I18n.t('End')}
				onPress={endCall}
				iconName='phone-end'
				color={colors.fontDanger}
			/>
		</HeaderButton.Container>
	);
};

export default EndCall;
