import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import { IApplicationState } from '../../definitions';
import I18n from '../../i18n';
import Item from './Item';
import { TSettingsValues } from '../../reducers/settings';

interface ITimezone {
	utcOffset?: number;
	Message_TimeFormat?: TSettingsValues;
}

const Timezone = ({ utcOffset, Message_TimeFormat }: ITimezone) => {
	if (!utcOffset) {
		return null;
	}

	return (
		<Item
			label={I18n.t('Timezone')}
			content={`${moment()
				.utcOffset(utcOffset)
				.format(Message_TimeFormat as string)} (UTC ${utcOffset})`}
		/>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	Message_TimeFormat: state.settings.Message_TimeFormat
});

export default connect(mapStateToProps)(Timezone);
