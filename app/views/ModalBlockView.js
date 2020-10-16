import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';

import { withTheme } from '../theme';
import EventEmitter from '../utils/events';
import { themes } from '../constants/colors';
import * as HeaderButton from '../containers/HeaderButton';
import { modalBlockWithContext } from '../containers/UIKit/MessageBlock';
import RocketChat from '../lib/rocketchat';
import ActivityIndicator from '../containers/ActivityIndicator';
import { MODAL_ACTIONS, CONTAINER_TYPES } from '../lib/methods/actions';

import sharedStyles from './Styles';
import { textParser } from '../containers/UIKit/utils';
import Navigation from '../lib/Navigation';

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

Object.fromEntries = Object.fromEntries || (arr => arr.reduce((acc, [k, v]) => ((acc[k] = v, acc)), {}));
const groupStateByBlockIdMap = (obj, [key, { blockId, value }]) => {
	obj[blockId] = obj[blockId] || {};
	obj[blockId][key] = value;
	return obj;
};
const groupStateByBlockId = obj => Object.entries(obj).reduce(groupStateByBlockIdMap, {});
const filterInputFields = ({ element, elements = [] }) => {
	if (element && element.initialValue) {
		return true;
	}
	if (elements.length && elements.map(e => ({ element: e })).filter(filterInputFields).length) {
		return true;
	}
};
const mapElementToState = ({ element, blockId, elements = [] }) => {
	if (elements.length) {
		return elements.map(e => ({ element: e, blockId })).filter(filterInputFields).map(mapElementToState);
	}
	return [element.actionId, { value: element.initialValue, blockId }];
};
const reduceState = (obj, el) => (Array.isArray(el[0]) ? { ...obj, ...Object.fromEntries(el) } : { ...obj, [el[0]]: el[1] });

class ModalBlockView extends React.Component {
	static navigationOptions = ({ route }) => {
		const data = route.params?.data;
		const { view } = data;
		const { title } = view;
		return {
			title: textParser([title])
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		language: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);
		this.submitting = false;
		const data = props.route.params?.data;
		this.values = data.view.blocks.filter(filterInputFields).map(mapElementToState).reduce(reduceState, {});
		this.state = {
			data,
			loading: false
		};
		this.setHeader();
	}

	componentDidMount() {
		const { data } = this.state;
		const { viewId } = data;
		EventEmitter.addEventListener(viewId, this.handleUpdate);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!isEqual(nextProps, this.props)) {
			return true;
		}
		if (!isEqual(nextState, this.state)) {
			return true;
		}

		return false;
	}

	componentDidUpdate(prevProps) {
		const { navigation, route } = this.props;
		const oldData = prevProps.route.params?.data ?? {};
		const newData = route.params?.data ?? {};
		if (oldData.viewId !== newData.viewId) {
			navigation.push('ModalBlockView', { data: newData });
		}
	}

	componentWillUnmount() {
		const { data } = this.state;
		const { viewId } = data;
		EventEmitter.removeListener(viewId, this.handleUpdate);
	}

	setHeader = () => {
		const { data } = this.state;
		const { navigation } = this.props;
		const { view } = data;
		const { title, close, submit } = view;
		navigation.setOptions({
			title: textParser([title]),
			headerLeft: close ? () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={textParser([close.text])}
						style={styles.submit}
						onPress={this.cancel}
						testID='close-modal-uikit'
					/>
				</HeaderButton.Container>
			) : null,
			headerRight: submit ? () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={textParser([submit.text])}
						style={styles.submit}
						onPress={this.submit}
						testID='submit-modal-uikit'
					/>
				</HeaderButton.Container>
			) : null
		});
	}

	handleUpdate = ({ type, ...data }) => {
		if ([MODAL_ACTIONS.ERRORS].includes(type)) {
			const { errors } = data;
			this.setState({ errors });
		} else {
			this.setState({ data });
			this.setHeader();
		}
	};

	cancel = async({ closeModal }) => {
		const { data } = this.state;
		const { appId, viewId, view } = data;

		// handle tablet case
		if (closeModal) {
			closeModal();
		} else {
			Navigation.back();
		}

		try {
			await RocketChat.triggerCancel({
				appId,
				viewId,
				view: {
					...view,
					id: viewId,
					state: groupStateByBlockId(this.values)
				},
				isCleared: true
			});
		} catch (e) {
			// do nothing
		}
	}

	submit = async() => {
		const { data } = this.state;
		if (this.submitting) {
			return;
		}

		this.submitting = true;

		const { appId, viewId } = data;
		this.setState({ loading: true });
		try {
			await RocketChat.triggerSubmitView({
				viewId,
				appId,
				payload: {
					view: {
						id: viewId,
						state: groupStateByBlockId(this.values)
					}
				}
			});
		} catch (e) {
			// do nothing
		}

		this.submitting = false;
		this.setState({ loading: false });
	};

	action = async({ actionId, value, blockId }) => {
		const { data } = this.state;
		const { mid, appId, viewId } = data;
		await RocketChat.triggerBlockAction({
			container: {
				type: CONTAINER_TYPES.VIEW,
				id: viewId
			},
			actionId,
			appId,
			value,
			blockId,
			mid
		});
		this.changeState({ actionId, value, blockId });
	}

	changeState = ({ actionId, value, blockId = 'default' }) => {
		this.values[actionId] = {
			blockId,
			value
		};
	};

	render() {
		const { data, loading, errors } = this.state;
		const { theme, language } = this.props;
		const { values } = this;
		const { view } = data;
		const { blocks } = view;

		return (
			<KeyboardAwareScrollView
				style={[
					styles.container,
					{ backgroundColor: themes[theme].auxiliaryBackground }
				]}
				keyboardShouldPersistTaps='always'
			>
				<View style={styles.content}>
					{
						React.createElement(
							modalBlockWithContext({
								action: this.action,
								state: this.changeState,
								...data
							}),
							{
								blocks,
								errors,
								language,
								values
							}
						)
					}
				</View>
				{loading ? <ActivityIndicator absolute size='large' theme={theme} /> : null}
			</KeyboardAwareScrollView>
		);
	}
}

const mapStateToProps = state => ({
	language: state.login.user && state.login.user.language
});

export default connect(mapStateToProps)(withTheme(ModalBlockView));
