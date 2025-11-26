import React from 'react';
import { Text, View } from 'react-native';
import { type Tasks as TasksProps } from '@rocket.chat/message-parser';

import Inline from '../Inline';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import getBlockValueString from '../../../../lib/methods/getBlockValueString';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList = ({ value = [] }: ITasksProps) => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map((item, index) => {
				const key = `${item.type}-${getBlockValueString(item.value)}-${index}`;
				return (
					<View key={key} style={styles.row}>
						<Text style={[styles.text, { color: colors.fontDefault }]}>
							<CustomIcon
								testID={item.status ? 'task-list-checked' : 'task-list-unchecked'}
								name={item.status ? 'checkbox-checked' : 'checkbox-unchecked'}
								size={24}
							/>
						</Text>
						<Text style={[styles.inline, { color: colors.fontDefault }]}>
							<Inline value={item.value} />
						</Text>
					</View>
				);
			})}
		</View>
	);
};

export default TaskList;
