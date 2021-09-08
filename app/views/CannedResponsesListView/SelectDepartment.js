import React from 'react';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';

import styles from './styles';

const SelectDepartment = ({
	onDepartmentSelect, initial, theme, departments, getDepartments
}) => (
	<>
		<MultiSelect
			theme={theme}
			wrapInputStyle={[styles.selectDepartment, { backgroundColor: themes[theme].messageboxBackground, borderColor: themes[theme].borderColor }]}
			onChange={onDepartmentSelect}
			onSearch={getDepartments}
			value={initial && [initial]}
			options={departments.map(department => ({
				value: department,
				text: { text: department.name }
			}))}
		/>
	</>
);
SelectDepartment.propTypes = {
	initial: PropTypes.object,
	onDepartmentSelect: PropTypes.func,
	theme: PropTypes.string,
	departments: PropTypes.array,
	getDepartments: PropTypes.func
};

export default SelectDepartment;
