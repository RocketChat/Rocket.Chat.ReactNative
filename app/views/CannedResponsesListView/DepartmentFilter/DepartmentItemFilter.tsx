import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';
import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';
import { CustomIcon } from '../../../containers/CustomIcon';
import sharedStyles from '../../Styles';

interface IDepartmentItemFilter {
	currentDepartment: ILivechatDepartment;
	value: ILivechatDepartment;
	onPress: (value: ILivechatDepartment) => void;
}

export const ROW_HEIGHT = 44;

const styles = StyleSheet.create({
	container: {
		paddingVertical: 11,
		height: ROW_HEIGHT,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	text: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

const DepartmentItemFilter = ({ currentDepartment, value, onPress }: IDepartmentItemFilter): JSX.Element => {
	const { colors } = useTheme();
	const iconName = currentDepartment?._id === value?._id ? 'check' : null;

	return (
		<Touch onPress={() => onPress(value)} style={{ backgroundColor: colors.surfaceRoom }}>
			<View style={styles.container}>
				<Text style={[styles.text, { color: colors.fontSecondaryInfo }]}>{value?.name}</Text>
				{iconName ? <CustomIcon name={iconName} size={22} color={colors.fontSecondaryInfo} /> : null}
			</View>
		</Touch>
	);
};

export default DepartmentItemFilter;
