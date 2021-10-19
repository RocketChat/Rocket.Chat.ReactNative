import React from 'react';
import { Text } from 'react-native';
import { Tasks as TasksProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList = ({ value = [] }: ITasksProps): JSX.Element => {
	console.log({ value });
	return (
		<Text
			style={{
				marginLeft: 0,
				paddingLeft: 0
			}}>
			{value.map(item => (
				<>
					{item.status ? '- [x] ' : '- [] '}
					<Inline value={item.value} />
				</>
			))}
		</Text>
	);
};

export default TaskList;
