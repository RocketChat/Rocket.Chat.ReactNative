import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import EventEmitter from '../utils/events';
import { themes } from '../constants/colors';
import { CloseModalButton, CustomHeaderButtons, Item } from '../containers/HeaderButton';
import { modalBlockWithContext } from '../containers/UIKit/MessageBlock';
import RocketChat from '../lib/rocketchat';

import sharedStyles from './Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	submit: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});

class GenericView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme } = screenProps;
		return {
			title: '',
			...themedHeader(theme),
			headerLeft: <CloseModalButton testID='close-generic-view' navigation={navigation} />,
			headerRight: (
				<CustomHeaderButtons>
					<Item
						title='Submit'
						style={styles.submit}
						onPress={navigation.getParam('submit', () => {})}
						testID='submit-modal-uikit'
					/>
				</CustomHeaderButtons>
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);
		const { navigation } = props;
		const data = navigation.getParam('data');
		this.state = { data };
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ submit: this.submit });

		EventEmitter.addEventListener('1234', this.handleUpdate);
	}

	componentWillUnmount() {
		EventEmitter.removeListener('1234');
	}

	handleUpdate = (data) => {
		this.setState({ data });
	};

	submit = () => {
		const { data } = this.state;
		const { appId, viewId } = data;
		RocketChat.triggerSubmitView({
			viewId,
			appId,
			payload: {
				view: {
					id: viewId,
					state: Object.entries({}).reduce((obj, [key, { blockId, value }]) => {
						obj[blockId] = obj[blockId] || {};
						obj[blockId][key] = value;
						return obj;
					}, {})
				}
			}
		});
	};

	render() {
		const { data } = this.state;
		const { theme } = this.props;
		const { blocks } = data;

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				{
					React.createElement(modalBlockWithContext({
						action: ({
							actionId, appId, value, blockId
						}) => RocketChat.triggerBlockAction({
							actionId, appId, value, blockId, rid: '1234', mid: '1234'
						}),
						state: ({ actionId = 'abc', value, /* ,appId, */blockId = 'default' }) => {
							console.log(actionId, blockId, value);
						},
						appId: '1234'
					}), { blocks })
				}
			</View>
		);
	}
}

export default withTheme(GenericView);
