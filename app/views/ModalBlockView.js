import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';

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

const groupStateByBlockIdMap = (obj, [key, { blockId, value }]) => {
	obj[blockId] = obj[blockId] || {};
	obj[blockId][key] = value;
	return obj;
};
const groupStateByBlockId = obj => Object.entries(obj).reduce(groupStateByBlockIdMap, {});
const filterInputFields = ({ type, element }) => type === 'input' && element.initialValue;
const mapElementToState = ({ element, blockId }) => [element.actionId, { value: element.initialValue, blockId }];

class ModalBlockView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme, closeModal } = screenProps;
		const data = navigation.getParam('data');
		const cancel = navigation.getParam('cancel', () => {});
		const { view } = data;
		const { title, submit, close } = view;
		return {
			title: textParser([title]),
			...themedHeader(theme),
			headerLeft: (
				<CustomHeaderButtons>
					<Item
						title={textParser([close.text])}
						style={styles.submit}
						onPress={() => cancel({ closeModal })}
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
		language: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);
		const { navigation } = props;
		const data = navigation.getParam('data');
		this.keys = Object.fromEntries(data.view.blocks.filter(filterInputFields).map(mapElementToState)) || {};
		this.state = {
			data,
			loading: false
		};
	}

	componentDidMount() {
		const { data } = this.state;
		const { navigation } = this.props;
		const { viewId } = data;
		navigation.setParams({ submit: this.submit, cancel: this.cancel });

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

	cancel = async({ closeModal }) => {
		const { data } = this.state;
		const { navigation } = this.props;
		const { appId, viewId, view } = data;
		this.setState({ loading: true });
		try {
			await RocketChat.triggerCancel({
				appId,
				viewId,
				view: {
					...view,
					id: viewId,
					state: groupStateByBlockId(this.keys)
				},
				isCleared: true
			});
		} catch (e) {
			// do nothing
		}
		// handle tablet case
		if (closeModal) {
			closeModal();
		} else {
			navigation.pop();
		}
		this.setState({ loading: false });
	}

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
						state: groupStateByBlockId(this.keys)
					}
				}
			});
			navigation.pop();
		} catch (e) {
			// do nothing
		}
		this.setState({ loading: false });
	};

	action = ({ actionId, value, blockId }) => {
		const { data } = this.state;
		const {
			rid, mid, appId, viewId
		} = data;
		RocketChat.triggerBlockAction({
			container: {
				type: 'view',
				id: viewId
			},
			actionId,
			appId,
			value,
			blockId,
			rid,
			mid
		});
	}

	changeState = ({ actionId, value, blockId = 'default' }) => {
		const { data } = this.state;
		const { view } = data;
		const { blocks } = view;

		// we need to do this because when the component is re-render we lose the value
		const block = blocks.find(b => b.element && b.element.actionId === actionId);
		if (block.element) {
			block.element.initialValue = value;
		}

		this.keys[actionId] = {
			blockId,
			value
		};
	};

	render() {
		const { data, loading, errors } = this.state;
		const { theme, language } = this.props;
		const { view, appId } = data;
		const { blocks } = view;

		return (
			<ScrollView style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<View style={styles.content}>
					{
						React.createElement(
							modalBlockWithContext({
								action: this.action,
								state: this.changeState,
								appId
							}),
							{ blocks, errors, language }
						)
					}
				</View>
				{loading ? <ActivityIndicator absolute size='large' /> : null}
			</ScrollView>
		);
	}
}

const mapStateToProps = state => ({
	language: state.login.user && state.login.user.language
});

export default connect(mapStateToProps)(withTheme(ModalBlockView));
