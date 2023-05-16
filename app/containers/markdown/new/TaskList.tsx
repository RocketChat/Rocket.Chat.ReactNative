import React from 'react';
import { Text, View } from 'react-native';
import { Tasks as TasksProps } from '@rocket.chat/message-parser';
import CheckBox from '@react-native-community/checkbox';

import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList = ({ value = [] }: ITasksProps) => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row}>
					<Text style={[styles.text, { color: colors.bodyText }]}>
						<CheckBox disabled style={[styles.checkBox]} boxType='square' value={item.status} />
					</Text>
					<Text style={[styles.inline, { color: colors.bodyText }]}>
						<Inline value={item.value} />
					</Text>
				</View>
			))}
		</View>
	);
};

export default TaskList;
