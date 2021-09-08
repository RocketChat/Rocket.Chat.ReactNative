import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import CannedSearchBox from './CannedSearchBox';
import SelectDepartment from './SelectDepartment';
import { themes } from '../../constants/colors';
import styles from './styles';
import I18n from '../../i18n';

const HeaderCanned = ({
	theme, onChangeText, onDepartmentSelect, initial, departments, getDepartments
}) => (
	<View style={[styles.containerHeader, { backgroundColor: themes[theme].messageboxBackground }]}>
		<Text style={[{ color: themes[theme].auxiliaryTintColor }]}>{I18n.t('Type_!_Canned_Response')}</Text>

		<View style={styles.containerRow}>
			<CannedSearchBox onChangeText={onChangeText} theme={theme} />
			<SelectDepartment
				initial={initial}
				theme={theme}
				onDepartmentSelect={onDepartmentSelect}
				departments={departments}
				getDepartments={getDepartments}
			/>
		</View>
	</View>
);

HeaderCanned.propTypes = {
	onChangeText: PropTypes.func,
	theme: PropTypes.string,
	onDepartmentSelect: PropTypes.func,
	initial: PropTypes.object,
	departments: PropTypes.array,
	getDepartments: PropTypes.func
};

HeaderCanned.defaultProps = {
	onChangeText: () => {},
	onDepartmentSelect: () => {},
	getDepartments: () => {}
};

export default HeaderCanned;
