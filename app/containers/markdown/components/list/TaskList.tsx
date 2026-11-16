import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { type Tasks as TasksProps } from '@rocket.chat/message-parser';

import Inline from '../Inline';
import NestedLists, { type TRenderList, type WithNested } from './NestedLists';
import styles from '~/containers/markdown/styles';
import { useTheme } from '~/theme';
import { CustomIcon } from '~/containers/CustomIcon';

interface ITasksProps {
	value: WithNested<TasksProps['value'][number]>[];
	renderList: TRenderList;
}

const TaskList = ({ value = [], renderList }: ITasksProps) => {
	const { colors } = useTheme();
	return (
		<View>
			{value.map((item, index) => (
				<Fragment key={index}>
					<View style={styles.row}>
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
					<NestedLists lists={item.nested} renderList={renderList} />
				</Fragment>
			))}
		</View>
	);
};

export default TaskList;
