import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';

import I18n from '../../i18n';
import Item from './Item';

const Timezone = ({ utcOffset, Message_TimeFormat, theme }) => (utcOffset ? (
	<Item
		label={I18n.t('Timezone')}
		content={`${ moment().utcOffset(utcOffset).format(Message_TimeFormat) } (UTC ${ utcOffset })`}
		theme={theme}
	/>
) : null);
Timezone.propTypes = {
	utcOffset: PropTypes.number,
	Message_TimeFormat: PropTypes.string,
	theme: PropTypes.string
};

const mapStateToProps = state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat
});

export default connect(mapStateToProps)(Timezone);
