import React, { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../../theme';
import * as List from '../../../../containers/List';
import OmnichannelStatus from '../../../../ee/omnichannel/containers/OmnichannelHeader';
import { E2E_BANNER_TYPE, themes } from '../../../../lib/constants';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { RoomsContext } from '../../RoomsSearchProvider';

export type TEncryptionBanner = 'REQUEST_PASSWORD' | 'SAVE_PASSWORD';

const ListHeader = React.memo(() => {
	const { theme } = useTheme();
	const { searchEnabled } = useContext(RoomsContext);
	const encryptionBanner = useAppSelector(state => state.encryption.banner);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation<any>();

	if (searchEnabled) {
		return null;
	}

	const goEncryption = () => {
		logEvent(events.RL_GO_E2E_SAVE_PASSWORD);

		const isSavePassword = encryptionBanner === E2E_BANNER_TYPE.SAVE_PASSWORD;
		if (isMasterDetail) {
			const screen = isSavePassword ? 'E2ESaveYourPasswordView' : 'E2EEnterYourPasswordView';
			navigation.navigate('ModalStackNavigator', { screen });
		} else {
			const screen = isSavePassword ? 'E2ESaveYourPasswordStackNavigator' : 'E2EEnterYourPasswordStackNavigator';
			navigation.navigate(screen);
		}
	};

	return (
		<>
			{encryptionBanner ? (
				<>
					<List.Item
						title={
							encryptionBanner === E2E_BANNER_TYPE.REQUEST_PASSWORD ? 'Enter_E2EE_Password' : 'Save_Your_Encryption_Password'
						}
						left={() => <List.Icon name='encrypted' color={themes[theme].fontWhite} />}
						underlayColor={themes[theme].strokeHighlight}
						backgroundColor={themes[theme].strokeHighlight}
						color={themes[theme].fontWhite}
						onPress={goEncryption}
						testID='listheader-encryption'
					/>
					<List.Separator />
				</>
			) : null}
			<OmnichannelStatus />
		</>
	);
});

export default ListHeader;
