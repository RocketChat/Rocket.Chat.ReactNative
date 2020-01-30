import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import EventEmitter from '../utils/events';
import { themes } from '../constants/colors';
import { CustomHeaderButtons, Item } from '../containers/HeaderButton';
import { modalBlockWithContext } from '../containers/UIKit/MessageBlock';
import RocketChat from '../lib/rocketchat';
import ActivityIndicator from '../containers/ActivityIndicator';

import sharedStyles from './Styles';
import { textParser } from '../containers/UIKit/utils';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16
	},
	content: {
		paddingVertical: 16
	},
	submit: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});

class ModalBlockView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme } = screenProps;
		const data = navigation.getParam('data');
		const { view, appId, viewId } = data;
		const { title, submit, close } = view;
		return {
			title: textParser([title]),
			...themedHeader(theme),
			headerLeft: (
				<CustomHeaderButtons>
					<Item
						title={textParser([close.text])}
						style={styles.submit}
						onPress={() => {
							RocketChat.triggerCancel({ appId, viewId });
							navigation.pop();
						}}
						testID='close-modal-uikit'
					/>
				</CustomHeaderButtons>
			),
			headerRight: (
				<CustomHeaderButtons>
					<Item
						title={textParser([submit.text])}
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
		this.state = { data, loading: false };
		this.keys = {};
	}

	componentDidMount() {
		const { data } = this.state;
		const { navigation } = this.props;
		const { viewId } = data;
		navigation.setParams({ submit: this.submit });

		EventEmitter.addEventListener(viewId, this.handleUpdate);
	}

	componentDidUpdate(prevProps) {
		/* TODO: CHANGE THIS LOGIC */
		const { navigation } = this.props;
		const oldData = prevProps.navigation.getParam('data', {});
		const newData = navigation.getParam('data', {});
		if (!isEqual(oldData, newData)) {
			navigation.push('ModalBlockView', { data: newData });
		}
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
		this.setState({ loading: true });
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
		this.setState({ loading: false });
		navigation.pop();
	};

	render() {
		const { data, loading } = this.state;
		const { theme } = this.props;
		const {
			view,
			rid,
			mid
		} = data;
		const { blocks } = view;

		return (
			<ScrollView style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<View style={styles.content}>
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
				</View>
				{loading ? <ActivityIndicator absolute size='large' /> : null}
			</ScrollView>
		);
	}
}

export default withTheme(ModalBlockView);
