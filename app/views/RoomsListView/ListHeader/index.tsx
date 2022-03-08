import React from 'react';

import { withTheme } from '../../../theme';
import * as List from '../../../containers/List';
import { E2E_BANNER_TYPE } from '../../../lib/encryption/constants';
import { themes } from '../../../constants/colors';
import OmnichannelStatus from '../../../ee/omnichannel/containers/OmnichannelStatus';
import { IUser } from '../../../definitions';

export type TEncryptionBanner = 'REQUEST_PASSWORD' | 'SAVE_PASSWORD';

interface IRoomListHeader {
	searching: boolean;
	goEncryption: () => void;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	encryptionBanner: TEncryptionBanner;
	user: IUser;
	theme: string;
}

const ListHeader = React.memo(
	({ searching, goEncryption, goQueue, queueSize, inquiryEnabled, encryptionBanner, user, theme }: IRoomListHeader) => {
		if (searching) {
			return null;
		}

		return (
			<>
				{encryptionBanner ? (
					<>
						<List.Item
							title={
								encryptionBanner === E2E_BANNER_TYPE.REQUEST_PASSWORD
									? 'Enter_Your_E2E_Password'
									: 'Save_Your_Encryption_Password'
							}
							left={() => <List.Icon name='encrypted' color={themes[theme].buttonText} />}
							underlayColor={themes[theme].tintActive}
							backgroundColor={themes[theme].actionTintColor}
							color={themes[theme].buttonText}
							onPress={goEncryption}
							testID='listheader-encryption'
						/>
						<List.Separator />
					</>
				) : null}
				<List.Separator />
				<OmnichannelStatus
					// @ts-ignore // TODO - remove this @ts-ignore after merge omnichannel task
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

export default withTheme(ListHeader);
