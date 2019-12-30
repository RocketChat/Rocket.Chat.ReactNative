import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
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
		flex: 1,
		paddingHorizontal: 16
	},
	submit: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});

const parseText = ({ text }) => text;

class ModalBlockView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme } = screenProps;
		const data = navigation.getParam('data');
		const { view } = data;
		const { title, submit } = view;
		return {
			title: parseText(title),
			...themedHeader(theme),
			headerLeft: <CloseModalButton testID='close-generic-view' navigation={navigation} />,
			headerRight: (
				<CustomHeaderButtons>
					<Item
						title={parseText(submit.text)}
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
		this.keys = {};
	}

	componentDidMount() {
		const { data } = this.state;
		const { navigation } = this.props;
		const { viewId } = data;
		navigation.setParams({ submit: this.submit });

		EventEmitter.addEventListener(viewId, this.handleUpdate);
	}

	componentWillUnmount() {
		const { data } = this.state;
		const { viewId } = data;
		EventEmitter.removeListener(viewId);
	}

	handleUpdate = (data) => {
		this.setState({ data });
	};

	submit = async() => {
		const { data } = this.state;
		const { navigation } = this.props;
		const { appId, viewId } = data;
		try {
			await RocketChat.triggerSubmitView({
				viewId,
				appId,
				payload: {
					view: {
						id: viewId,
						state: Object.entries(this.keys).reduce((obj, [key, { blockId, value }]) => {
							obj[blockId] = obj[blockId] || {};
							obj[blockId][key] = value;
							return obj;
						}, {})
					}
				}
			});
		} catch (e) {
			// do nothing
		}
		navigation.pop();
	};

	render() {
		const { data } = this.state;
		const { theme } = this.props;
		const {
			view,
			rid,
			mid
		} = data;
		const { blocks } = view;

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<ScrollView>
					{
						React.createElement(modalBlockWithContext({
							action: ({
								actionId, appId, value, blockId
							}) => RocketChat.triggerBlockAction({
								actionId, appId, value, blockId, rid, mid
							}),
							state: ({ actionId, value, blockId = 'default' }) => {
								this.keys[actionId] = {
									blockId,
									value
								};
							},
							appId: data.appId
						}), { blocks })
					}
				</ScrollView>
			</View>
		);
	}
}

export default withTheme(ModalBlockView);
