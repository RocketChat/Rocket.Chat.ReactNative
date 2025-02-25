import React from 'react';

import { useTheme } from '../../../theme';
import * as List from '../../../containers/List';
import OmnichannelStatus from '../../../ee/omnichannel/containers/OmnichannelHeader';
import { IUser } from '../../../definitions';
import { E2E_BANNER_TYPE, themes } from '../../../lib/constants';

export type TEncryptionBanner = 'REQUEST_PASSWORD' | 'SAVE_PASSWORD';

interface IRoomListHeader {
	searching: boolean;
	goEncryption: () => void;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	encryptionBanner: TEncryptionBanner;
	user: IUser;
}

const ListHeader = React.memo(
	({ searching, goEncryption, goQueue, queueSize, inquiryEnabled, encryptionBanner, user }: IRoomListHeader) => {
		const { theme } = useTheme();

		if (searching) {
			return null;
		}

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
				<List.Separator />
				<OmnichannelStatus
					searching={searching}
					goQueue={goQueue}
					inquiryEnabled={inquiryEnabled}
					queueSize={queueSize}
					user={user}
				/>
			</>
		);
	}
);

export default ListHeader;
