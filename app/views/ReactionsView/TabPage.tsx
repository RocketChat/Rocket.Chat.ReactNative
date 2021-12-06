import React from 'react';
import { FlatList } from 'react-native-gesture-handler';

import UserItem from '../../presentation/UserItem';
import * as List from '../../containers/List';

interface ITabPageProps {
	reaction: any;
	theme: string;
	tabLabel: string;
}

class TabPage extends React.PureComponent<ITabPageProps> {
	constructor(props: ITabPageProps) {
		super(props);
	}

	renderItem = ({ item }: { item: any }) => (
		<UserItem
			onPress={() => {}}
			testID={`reaction-${this.props.reaction.emoji}-${item.username}`}
			username={item.username}
			name={item.name}
			theme={this.props.theme}
		/>
	);

	render = () => {
		const names = this.props.reaction.names || this.props.reaction.usernames;
		const users = this.props.reaction.usernames.map((u: string, i: number) => ({
			username: u,
			name: names[i]
		}));
		return (
			<FlatList
				data={users}
				ItemSeparatorComponent={List.Separator}
				keyExtractor={item => `row-${item.username}`}
				renderItem={this.renderItem}
			/>
		);
	};
}

export default TabPage;
