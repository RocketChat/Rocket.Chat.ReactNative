import { FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTheme } from '../../../theme';
import * as List from '../../../containers/List';
import DepartmentItemFilter, { ROW_HEIGHT } from './DepartmentItemFilter';
import { type ILivechatDepartment } from '../../../definitions/ILivechatDepartment';

const MAX_ROWS = 5;

interface IDepartmentFilterProps {
	currentDepartment: ILivechatDepartment;
	onDepartmentSelected: (value: ILivechatDepartment) => void;
	departments: ILivechatDepartment[];
}

const DepartmentFilter = ({ currentDepartment, onDepartmentSelected, departments }: IDepartmentFilterProps) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceRoom, borderColor: colors.strokeLight }]}>
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

const styles = StyleSheet.create((_theme, rt) => ({
	container: {
		marginBottom: rt.insets.bottom
	}
}));

export default DepartmentFilter;
