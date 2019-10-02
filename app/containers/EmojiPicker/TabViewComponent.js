import * as React from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import PropTypes from 'prop-types';
import categories from './categories';
import styles from './styles';
import RCActivityIndicator from '../ActivityIndicator';


const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

const SceneObject = {};

export default class TabViewComponent extends React.PureComponent {
	static propTypes = {
		renderCategory: PropTypes.func,
		tabEmojiStyle: PropTypes.object
	};

	state = {
		// eslint-disable-next-line react/no-unused-state
		index: 0,
		// eslint-disable-next-line react/no-unused-state
		routes: []
	};

	componentDidMount=() => {
		const { renderCategory } = this.props;
		let tempArray = [];
		tempArray =	categories.tabs.map(tab => (
			{ key: tab.category, title: tab.tabLabel }
		));
		categories.tabs.forEach((tab, index) => {
			SceneObject[tab.category] = React.memo(() => (
				<ScrollView
					key={tab.category}
					tabLabel={tab.tabLabel}
					style={styles.background}
					{...scrollProps}
				>
					{renderCategory(tab.category, index)}
				</ScrollView>
			));
		});

		this.setState(() => ({
			// eslint-disable-next-line react/no-unused-state
			routes: tempArray
		}));
	}

	renderLazyPlaceholder = () => <RCActivityIndicator />;


	render() {
		return (
			<TabView
				navigationState={this.state}
				renderScene={SceneMap(SceneObject)}
				// eslint-disable-next-line react/no-unused-state
				onIndexChange={index => this.setState({ index })}
				renderTabBar={props => (
					<TabBar
						{...props}
						style={{ backgroundColor: 'white' }}
						scrollEnabled
						tabStyle={{ width: 45 }}
					/>
				)
				}
				initialLayout={{ width: Dimensions.get('window').width }}
				keyboardDismissMode='none'
				style={styles.background}
				renderLazyPlaceholder={this.renderLazyPlaceholder}
				lazy
			/>
		);
	}
}
