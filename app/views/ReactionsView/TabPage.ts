import React from 'react';
import {
	View, Text, ScrollView
} from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import styles from './styles';
import Avatar from '../../containers/Avatar';

import UserItem from '../../presentation/UserItem'
import { FlatList } from 'react-native-gesture-handler';

interface ITabPageProps {
    reaction: any;
    theme: string;
}

interface IItemProps {
    username: string;
    name: string;
}

class TabPage extends React.PureComponent<ITabPageProps> {
    constructor(props: ITabPageProps) {
        super(props)
    }

    renderItem = (item: IItemProps) => {
        return <UserItem onPress={() => {}} testID={`reaction-${this.props.reaction.emoji}-${item.username}`} username={item.username} name={item.name} theme={this.props.theme} />
    }

    render = () => {
        const names = this.props.reaction.names || this.props.reaction.usernames;
        const users = this.props.reaction.usernames.map((u : string, i: number) => ({
            username: u,
            name: names[i]
        }))
        return (
            <FlatList
                data={users}
                keyExtractor={(item) => `row-${item.username}`}
                renderItem={this.render}
            />
        );
    }
}

export default TabPage;