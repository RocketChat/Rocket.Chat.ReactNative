import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';

import { withTheme } from '../theme';
import EventEmitter from '../utils/events';
import { themes } from '../constants/colors';
import * as HeaderButton from '../containers/HeaderButton';
import { modalBlockWithContext } from '../containers/UIKit/MessageBlock';
import RocketChat from '../lib/rocketchat';
import ActivityIndicator from '../containers/ActivityIndicator';
import { textParser } from '../containers/UIKit/utils';
import Navigation from '../lib/Navigation';
import { MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { ContainerTypes, ModalActions } from '../containers/UIKit/interfaces';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16
	},
	content: {
		paddingVertical: 16
	}
});

interface IValueBlockId {
	value: string;
	blockId: string;
}

type TElementToState = [string, IValueBlockId];
interface IActions {
	actionId: string;
	value: any;
	blockId?: string;
}

interface IValues {
	[key: string]: {
		[key: string]: string;
	};
}
interface IModalBlockViewState {
	data: any;
	loading: boolean;
	errors?: any;
}

interface IModalBlockViewProps {
	navigation: StackNavigationProp<MasterDetailInsideStackParamList, 'ModalBlockView'>;
	route: RouteProp<MasterDetailInsideStackParamList, 'ModalBlockView'>;
	theme: string;
	language: string;
	user: {
		id: string;
		token: string;
	};
}

// eslint-disable-next-line no-sequences
Object.fromEntries = Object.fromEntries || ((arr: any[]) => arr.reduce((acc, [k, v]) => ((acc[k] = v), acc), {}));
const groupStateByBlockIdMap = (obj: any, [key, { blockId, value }]: TElementToState) => {
	obj[blockId] = obj[blockId] || {};
	obj[blockId][key] = value;
	return obj;
};
const groupStateByBlockId = (obj: { [key: string]: any }) => Object.entries(obj).reduce(groupStateByBlockIdMap, {});
const filterInputFields = ({ element, elements = [] }: { element: any; elements?: any[] }) => {
	if (element && element.initialValue) {
		return true;
	}
	if (elements.length && elements.map(e => ({ element: e })).filter(filterInputFields).length) {
		return true;
	}
};

const mapElementToState = ({ element, blockId, elements = [] }: { element: any; blockId: string; elements?: any[] }): any => {
	if (elements.length) {
		return elements
			.map(e => ({ element: e, blockId }))
			.filter(filterInputFields)
			.map(mapElementToState);
	}
	return [element.actionId, { value: element.initialValue, blockId }];
};
const reduceState = (obj: any, el: any) =>
	Array.isArray(el[0]) ? { ...obj, ...Object.fromEntries(el) } : { ...obj, [el[0]]: el[1] };

class ModalBlockView extends React.Component<IModalBlockViewProps, IModalBlockViewState> {
	private submitting: boolean;

	private values: IValues;

	static navigationOptions = ({ route }: Pick<IModalBlockViewProps, 'route'>): StackNavigationOptions => {
		const data = route.params?.data;
		const { view } = data;
		const { title } = view;
		return {
			title: textParser([title])
		};
	};

	constructor(props: IModalBlockViewProps) {
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

	componentDidUpdate(prevProps: IModalBlockViewProps) {
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
			headerLeft: close
				? () => (
						<HeaderButton.Container>
							<HeaderButton.Item title={textParser([close.text])} onPress={this.cancel} testID='close-modal-uikit' />
						</HeaderButton.Container>
				  )
				: undefined,
			headerRight: submit
				? () => (
						<HeaderButton.Container>
							<HeaderButton.Item title={textParser([submit.text])} onPress={this.submit} testID='submit-modal-uikit' />
						</HeaderButton.Container>
				  )
				: undefined
		});
	};

	handleUpdate = ({ type, ...data }: { type: ModalActions }) => {
		if ([ModalActions.ERRORS].includes(type)) {
			const { errors }: any = data;
			this.setState({ errors });
		} else {
			this.setState({ data });
			this.setHeader();
		}
	};

	cancel = async ({ closeModal }: { closeModal?: () => void }) => {
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
	};

	submit = async () => {
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

	action = async ({ actionId, value, blockId }: IActions) => {
		const { data } = this.state;
		const { mid, appId, viewId } = data;
		await RocketChat.triggerBlockAction({
			container: {
				type: ContainerTypes.VIEW,
				id: viewId
			},
			actionId,
			appId,
			value,
			blockId,
			mid
		});
		this.changeState({ actionId, value, blockId });
	};

	changeState = ({ actionId, value, blockId = 'default' }: IActions) => {
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
				style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				keyboardShouldPersistTaps='always'>
				<View style={styles.content}>
					{React.createElement(
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
					)}
				</View>
				{loading ? <ActivityIndicator absolute size='large' theme={theme} /> : null}
			</KeyboardAwareScrollView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	language: state.login.user && state.login.user.language
});

export default connect(mapStateToProps)(withTheme(ModalBlockView));
