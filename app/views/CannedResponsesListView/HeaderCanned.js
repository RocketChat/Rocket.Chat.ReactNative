import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import CannedSearchBox from './CannedSearchBox';
import SelectDepartment, { filterDepartment } from './SelectDepartment';
import { themes } from '../../constants/colors';

import styles from './styles';
import I18n from '../../i18n';

const HeaderCanned = ({ theme, onChangeText, onDepartmentSelect }) => (
	<View style={[styles.containerHeader, { backgroundColor: themes[theme].messageboxBackground }]}>
		<Text style={[{ color: themes[theme].auxiliaryTintColor }]}>{I18n.t('Type_!_Canned_Response')}</Text>

		<View style={styles.containerRow}>
			<CannedSearchBox onChangeText={onChangeText} />
			<SelectDepartment
				initial={
					{
						value: filterDepartment[0],
						text: filterDepartment[0].name
					}
				}
				theme={theme}
				onDepartmentSelect={onDepartmentSelect}
			/>
		</View>
	</View>
);

HeaderCanned.propTypes = {
	onChangeText: PropTypes.func,
	theme: PropTypes.string,
	onDepartmentSelect: PropTypes.func
};

HeaderCanned.defaultProps = {
	onChangeText: () => {},
	onDepartmentSelect: () => {}
};

export default HeaderCanned;
