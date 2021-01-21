import React from 'react';
import PropTypes from 'prop-types';

import { withTheme } from '../../../theme';
import I18n from '../../../i18n';
import * as List from '../../../containers/List';
import { E2E_BANNER_TYPE } from '../../../lib/encryption/constants';
import { themes } from '../../../constants/colors';

import OmnichannelStatus from '../../../ee/omnichannel/containers/OmnichannelStatus';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goEncryption,
	goQueue,
	queueSize,
	inquiryEnabled,
	encryptionBanner,
	user,
	theme
}) => {
	const sortTitle = I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') });

	if (searching) {
		return null;
	}

	return (
		<>
			{encryptionBanner
				? (
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
				)
				: null}
			<List.Item
				title={sortTitle}
				left={() => <List.Icon name='sort' />}
				color={themes[theme].auxiliaryText}
				onPress={toggleSort}
				translateTitle={false}
			/>
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
});

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goEncryption: PropTypes.func,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool,
	encryptionBanner: PropTypes.string,
	user: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(ListHeader);
