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
import { MODAL_ACTIONS } from '../lib/methods/actions';

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

const Blocks = React.memo(({
	blocks, errors, rid, mid, appId, keys
}) => {
	const action = ({ actionId, value, blockId }) => RocketChat.triggerBlockAction({
		actionId, appId, value, blockId, rid, mid
	});

	const state = ({ actionId, value, blockId = 'default' }) => {
		const block = blocks.find(b => b.element && b.element.actionId === actionId);
		if (block.element) {
			block.element.initialValue = value;
		}
		keys[actionId] = {
			blockId,
			value
		};
	};

	return (
		React.createElement(
			modalBlockWithContext({
				action,
				state,
				appId
			}),
			{ blocks, errors }
		)
	);
}, (prevProps, nextProps) => isEqual(prevProps.blocks, nextProps.blocks) && isEqual(prevProps.keys, nextProps.keys) && isEqual(prevProps.errors, nextProps.errors));
Blocks.propTypes = {
	blocks: PropTypes.array,
	rid: PropTypes.string,
	mid: PropTypes.string,
	appId: PropTypes.string,
	keys: PropTypes.object,
	errors: PropTypes.object
};

class ModalBlockView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme, closeModal } = screenProps;
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
							// handle tablet case
							if (closeModal) {
								closeModal();
							} else {
								navigation.pop();
							}
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

	handleUpdate = ({ type, ...data }) => {
		if ([MODAL_ACTIONS.ERRORS].includes(type)) {
			const { errors } = data;
			this.setState({ errors });
		} else {
			this.setState({ data });
		}
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
			navigation.pop();
		} catch (e) {
			// do nothing
		}
		this.setState({ loading: false });
	};

	render() {
		const { data, loading, errors } = this.state;
		const { theme } = this.props;
		const { keys } = this;
		const {
			view,
			rid,
			mid,
			appId
		} = data;
		const { blocks } = view;

		return (
			<ScrollView style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<View style={styles.content}>
					<Blocks
						blocks={blocks}
						errors={errors}
						appId={appId}
						keys={keys}
						rid={rid}
						mid={mid}
					/>
				</View>
				{loading ? <ActivityIndicator absolute size='large' /> : null}
			</ScrollView>
		);
	}
}

export default withTheme(ModalBlockView);
