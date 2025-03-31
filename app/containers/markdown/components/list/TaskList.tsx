import React from 'react';
import { Text, View } from 'react-native';
import { Tasks as TasksProps } from '@rocket.chat/message-parser';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import Paragraph from '../Paragraph';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList = ({ value = [] }: ITasksProps) => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row}>
					<Text style={[styles.text, { color: colors.fontDefault }]}>
						<CustomIcon
							testID={item.status ? 'task-list-checked' : 'task-list-unchecked'}
							name={item.status ? 'checkbox-checked' : 'checkbox-unchecked'}
							size={24}
						/>
					</Text>
					<Paragraph value={item.value} />
				</View>
			))}
		</View>
	);
};

export default TaskList;
