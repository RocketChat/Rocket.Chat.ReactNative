import { memo } from 'react';

import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';
import * as List from '../../../containers/List';
import { useAppSelector } from '../../../lib/hooks';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import Navigation from '../../../lib/navigation/appNavigation';
import { SupportedVersionsWarning } from '../../../containers/SupportedVersions';

const SupportedVersionsWarnItem = () => {
	const { colors } = useTheme();
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const onPressSupportedVersionsWarning = () => {
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'SupportedVersionsWarning' });
		} else {
			showActionSheetRef({ children: <SupportedVersionsWarning /> });
		}
	};

	if (supportedVersionsStatus === 'warn') {
		return (
			<>
				<List.Item
					title={'Supported_versions_warning_update_required'}
					color={colors.fontDanger}
					left={() => <CustomIcon name='warning' size={20} color={colors.buttonBackgroundDangerDefault} />}
					onPress={onPressSupportedVersionsWarning}
					testID={`sidebar-supported-versions-warn`}
				/>
				<List.Separator />
			</>
		);
	}
	return null;
};

export default memo(SupportedVersionsWarnItem);
