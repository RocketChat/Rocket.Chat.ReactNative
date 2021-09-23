import React from 'react';
import { Text } from 'react-native';
import { Tasks as TasksProps } from '@rocket.chat/message-parser';
import { Checkbox } from 'react-native-ui-lib';

import Inline from './Inline';

interface ITasksProps {
	value: TasksProps['value'];
}

const TaskList: React.FC<ITasksProps> = ({ value }) => (
	<Text
		style={{
			marginLeft: 0,
			paddingLeft: 0
		}}>
		{value.map(item => (
			<>
				<Checkbox checked={item.status} /> <Inline value={item.value} />
			</>
		))}
	</Text>
);

export default TaskList;
