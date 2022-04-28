import React from 'react';
import { Text, View } from 'react-native';
import { Tasks as TasksProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList = ({ value = [] }: ITasksProps) => {
	const { theme } = useTheme();
	return (
		<View>
			{value.map(item => (
				<View style={styles.row}>
					<Text style={[styles.text, { color: themes[theme].bodyText }]}>{item.status ? '- [x] ' : '- [ ] '}</Text>
					<Inline value={item.value} />
				</View>
			))}
		</View>
	);
};

export default TaskList;
