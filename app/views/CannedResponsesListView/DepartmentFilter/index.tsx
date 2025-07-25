import React from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import * as List from '../../../containers/List';
import DepartmentItemFilter, { ROW_HEIGHT } from './DepartmentItemFilter';
import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';

const MAX_ROWS = 5;

interface IDepartmentFilterProps {
	currentDepartment: ILivechatDepartment;
	onDepartmentSelected: (value: ILivechatDepartment) => void;
	departments: ILivechatDepartment[];
}

const DepartmentFilter = ({ currentDepartment, onDepartmentSelected, departments }: IDepartmentFilterProps) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View
			style={{
				backgroundColor: colors.surfaceRoom,
				borderColor: colors.strokeLight,
				marginBottom: insets.bottom
			}}>
			<FlatList
				style={{ maxHeight: MAX_ROWS * ROW_HEIGHT }}
				data={departments}
				keyExtractor={item => item._id}
				renderItem={({ item }) => (
					<DepartmentItemFilter onPress={onDepartmentSelected} currentDepartment={currentDepartment} value={item} />
				)}
				ItemSeparatorComponent={List.Separator}
			/>
		</View>
	);
};

export default DepartmentFilter;
