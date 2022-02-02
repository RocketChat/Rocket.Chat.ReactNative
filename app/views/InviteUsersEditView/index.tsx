import { StackNavigationOptions } from '@react-navigation/stack';
import React from 'react';
import { TextInputProps, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';

import { inviteLinksCreate, inviteLinksSetParams } from '../../actions/inviteLinks';
import { themes } from '../../constants/colors';
import Button from '../../containers/Button';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { IApplicationState, IBaseScreen } from '../../definitions';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { events, logEvent } from '../../utils/log';
import styles from './styles';

const OPTIONS = {
	days: [
		{
			label: '1',
			value: 1
		},
		{
			label: '7',
			value: 7
		},
		{
			label: '15',
			value: 15
		},
		{
			label: '30',
			value: 30
		}
	],
	maxUses: [
		{
			label: '1',
			value: 1
		},
		{
			label: '5',
			value: 5
		},
		{
			label: '10',
			value: 10
		},
		{
			label: '25',
			value: 25
		},
		{
			label: '50',
			value: 50
		},
		{
			label: '100',
			value: 100
		}
	]
};

interface IInviteUsersEditViewProps extends IBaseScreen<ChatsStackParamList, 'InviteUsersEditView'> {
	days: number;
	maxUses: number;
}

class InviteUsersEditView extends React.Component<IInviteUsersEditViewProps, any> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Invite_users')
	});

	private rid: string;

	constructor(props: IInviteUsersEditViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
	}

	onValueChangePicker = (key: string, value: number) => {
		const { dispatch } = this.props;
		logEvent(events.IU_EDIT_SET_LINK_PARAM);
		const params = {
			[key]: value
		};
		dispatch(inviteLinksSetParams(params));
	};

	createInviteLink = () => {
		const { dispatch, navigation } = this.props;
		logEvent(events.IU_EDIT_CREATE_LINK);
		dispatch(inviteLinksCreate(this.rid));
		navigation.pop();
	};

	renderPicker = (key: 'days' | 'maxUses', first: string) => {
		const { props } = this;
		const { theme } = props;
		const textInputStyle: TextInputProps = { style: { ...styles.pickerText, color: themes[theme].actionTintColor } };
		const firstEl = [
			{
				label: I18n.t(first),
				value: 0
			}
		];
		return (
			<RNPickerSelect
				style={{ viewContainer: styles.viewContainer }}
				value={props[key]}
				textInputProps={textInputStyle}
				useNativeAndroidPickerStyle={false}
				placeholder={{}}
				onValueChange={value => this.onValueChangePicker(key, value)}
				items={firstEl.concat(OPTIONS[key])}
			/>
		);
	};

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView>
				<List.Container>
					<StatusBar />
					<List.Section>
						<List.Separator />
						<List.Item title='Expiration_Days' right={() => this.renderPicker('days', 'Never')} />
						<List.Separator />
						<List.Item title='Max_number_of_uses' right={() => this.renderPicker('maxUses', 'No_limit')} />
						<List.Separator />
					</List.Section>
					<View style={styles.innerContainer}>
						<Button title={I18n.t('Generate_New_Link')} type='primary' onPress={this.createInviteLink} theme={theme} />
					</View>
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	days: state.inviteLinks.days,
	maxUses: state.inviteLinks.maxUses
});

export default connect(mapStateToProps)(withTheme(InviteUsersEditView));
