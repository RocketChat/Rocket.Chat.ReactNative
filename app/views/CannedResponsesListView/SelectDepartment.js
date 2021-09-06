import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';

import styles from './styles';

export const filterDepartment = [
	{
		_id: 'all',
		name: I18n.t('All')
	},
	{
		_id: 'public',
		name: I18n.t('Public')
	},
	{
		_id: 'private',
		name: I18n.t('Private')
	}
];

const SelectDepartment = ({
	onDepartmentSelect, initial, theme
}) => {
	const [departments, setDepartments] = useState([]);

	const getDepartments = debounce(async(keyword = '') => {
		try {
			const res = await RocketChat.getDepartments(keyword);
			const regExp = new RegExp(keyword, 'gi');
			const filterWithText = filterDepartment.filter(dep => regExp.test(dep.name));
			res.success
				? setDepartments([...filterWithText, ...res.departments])
				: setDepartments(filterWithText);
		} catch {
			// do nothing
		}
	}, 300);

	useEffect(() => {
		getDepartments();
	}, []);

	return (
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
};
SelectDepartment.propTypes = {
	initial: PropTypes.object,
	onDepartmentSelect: PropTypes.func,
	theme: PropTypes.string
};

export default SelectDepartment;
