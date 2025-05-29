import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import Touch from '../../../../containers/Touch';
import i18n from '../../../../i18n';

const styles = StyleSheet.create({
	backContainer: {
		paddingHorizontal: 16
	}
});

interface IEditImageViewProps {
	isPortrait: boolean;
	onUndoPress: () => void;
}

const UndoEdit = ({ isPortrait, onUndoPress }: IEditImageViewProps) => {
	const { colors } = useTheme();

	return (
		<View style={{ ...styles.backContainer, alignItems: isPortrait ? 'flex-start' : 'flex-end' }}>
			<Touch accessible accessibilityLabel={i18n.t('Undo_edit')} onPress={onUndoPress}>
				<CustomIcon name='history' color={colors.fontDefault} size={24} />
			</Touch>
		</View>
	);
};

export default UndoEdit;
