import { connect } from 'react-redux';
import { type Subscription } from 'rxjs';
import { Component } from 'react';

import I18n from '../i18n';
import { type TSupportedThemes, withTheme } from '../theme';
import * as List from '../containers/List';
import database from '../lib/database';
import {
	changePasscode,
	checkHasPasscode,
	supportedBiometryLabel,
	enableBiometry,
	handleLocalAuthentication,
	logUnlessUserCanceled
} from '../lib/methods/helpers/localAuthentication';
import { DEFAULT_AUTO_LOCK } from '../lib/constants/localAuthentication';
import { biometricTrustStore } from '../lib/biometricTrustStore';
import { themes } from '../lib/constants/colors';
import SafeAreaView from '../containers/SafeAreaView';
import { events, logEvent } from '../lib/methods/helpers/log';
import { type IApplicationState, type TServerModel } from '../definitions';
import Switch from '../containers/Switch';
import { showErrorAlert } from '../lib/methods/helpers/info';

const DEFAULT_BIOMETRY = false;

interface IItem {
	title: string;
	value: number;
	disabled?: boolean;
}

interface IScreenLockConfigViewProps {
	theme: TSupportedThemes;
	server: string;
	Force_Screen_Lock: boolean;
	Force_Screen_Lock_After: number;
}

interface IScreenLockConfigViewState {
	autoLock: boolean;
	autoLockTime?: number | null;
	biometry: boolean;
	biometryLabel: string | null;
	biometryBusy: boolean;
}

class ScreenLockConfigView extends Component<IScreenLockConfigViewProps, IScreenLockConfigViewState> {
	private serverRecord?: TServerModel;

	private observable?: Subscription;

	static navigationOptions = () => ({
		title: I18n.t('Screen_lock')
	});

	constructor(props: IScreenLockConfigViewProps) {
		super(props);
		this.state = {
			autoLock: false,
			autoLockTime: null,
			biometry: DEFAULT_BIOMETRY,
			biometryLabel: null,
			biometryBusy: false
		};
		this.init();
	}

	componentWillUnmount() {
		if (this.observable && this.observable.unsubscribe) {
			this.observable.unsubscribe();
		}
	}

	defaultAutoLockOptions = [
		{
			title: I18n.t('Local_authentication_auto_lock_60'),
			value: 60
		},
		{
			title: I18n.t('Local_authentication_auto_lock_300'),
			value: 300
		},
		{
			title: I18n.t('Local_authentication_auto_lock_900'),
			value: 900
		},
		{
			title: I18n.t('Local_authentication_auto_lock_1800'),
			value: 1800
		},
		{
			title: I18n.t('Local_authentication_auto_lock_3600'),
			value: 3600
		}
	];

	init = async () => {
		const { server } = this.props;
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		try {
			this.serverRecord = await serversCollection.find(server);
			this.setState(
				{
					autoLock: this.serverRecord?.autoLock,
					autoLockTime: this.serverRecord?.autoLockTime === null ? DEFAULT_AUTO_LOCK : this.serverRecord?.autoLockTime
				},
				() => this.hasBiometry()
			);
		} catch (error) {
			// Do nothing
		}

		const biometryLabel = await supportedBiometryLabel();
		this.setState({ biometryLabel });
	};

	save = async () => {
		logEvent(events.SLC_SAVE_SCREEN_LOCK);
		const { autoLock, autoLockTime } = this.state;
		const serversDB = database.servers;
		await serversDB.write(async () => {
			await this.serverRecord?.update(record => {
				record.autoLock = autoLock;
				record.autoLockTime = autoLockTime === null ? DEFAULT_AUTO_LOCK : autoLockTime;
			});
		});
	};

	hasBiometry = () => {
		const biometry = biometricTrustStore.isEnabled();
		this.setState({ biometry });
	};

	changePasscode = async ({ force }: { force: boolean }) => {
		const { autoLock } = this.state;
		if (autoLock) {
			try {
				await handleLocalAuthentication({ canCloseModal: true });
			} catch (e) {
				logUnlessUserCanceled(e);
				return;
			}
		}
		logEvent(events.SLC_CHANGE_PASSCODE);
		try {
			await changePasscode({ force });
		} catch (e) {
			logUnlessUserCanceled(e);
		}
	};

	// Takes the Switch's target value; the row onPress passes a non-boolean, so it flips instead. The
	// updater guard makes a double fire from one tap a no-op rather than a toggle back.
	toggleAutoLock = (value?: boolean) => {
		if (this.props.Force_Screen_Lock) {
			return;
		}
		const target = typeof value === 'boolean' ? value : !this.state.autoLock;
		let applied = false;
		this.setState(
			({ autoLock }) => {
				if (autoLock === target) {
					return null;
				}
				applied = true;
				return { autoLock: target, autoLockTime: DEFAULT_AUTO_LOCK };
			},
			async () => {
				if (!applied) {
					return;
				}
				logEvent(events.SLC_TOGGLE_AUTOLOCK);
				const { autoLock } = this.state;
				if (autoLock) {
					try {
						await checkHasPasscode({ force: false });
						this.hasBiometry();
					} catch {
						// Revert the toggle; its own callback persists the reverted state, so skip the
						// save() below — otherwise one canceled toggle issues two writes.
						this.toggleAutoLock();
						return;
					}
				}
				this.save();
			}
		);
	};

	toggleBiometry = () => {
		if (this.state.biometryBusy) {
			return;
		}
		logEvent(events.SLC_TOGGLE_BIOMETRY);
		this.setState(
			({ biometry }) => ({ biometry: !biometry, biometryBusy: true }),
			async () => {
				const { biometry } = this.state;
				// Enabling goes through enableBiometry so a re-bind carries an explicit consent prompt.
				const result = biometry ? await enableBiometry() : await biometricTrustStore.setBiometryEnabled(false);
				if (result.kind !== 'success') {
					// Only the enable path can fail, and it always forces the persisted flag off, so the
					// correct UI state is unconditionally `false`.
					this.setState({ biometry: false, biometryBusy: false });
					if (result.kind === 'unavailable') {
						showErrorAlert(I18n.t('Local_authentication_biometry_unavailable'), I18n.t('Oops'));
					} else if (result.kind !== 'canceled') {
						showErrorAlert(I18n.t('Local_authentication_biometry_enable_failed'), I18n.t('Oops'));
					}
					return;
				}
				this.setState({ biometryBusy: false });
			}
		);
	};

	isSelected = (value: number) => {
		const { autoLockTime } = this.state;
		return autoLockTime === value;
	};

	changeAutoLockTime = (autoLockTime: number) => {
		logEvent(events.SLC_CHANGE_AUTOLOCK_TIME);
		this.setState({ autoLockTime }, () => this.save());
	};

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].badgeBackgroundLevel2} />;
	};

	renderItem = ({ item }: { item: IItem }) => {
		const { title, value, disabled } = item;
		return (
			<>
				<List.Item
					title={title}
					onPress={() => this.changeAutoLockTime(value)}
					right={() => (this.isSelected(value) ? this.renderIcon() : null)}
					disabled={disabled}
					translateTitle={false}
					additionalAccessibilityLabel={this.isSelected(value)}
					additionalAccessibilityLabelCheck
					testID={`screen-lock-config-view-auto-lock-time-${value}`}
				/>
				<List.Separator />
			</>
		);
	};

	renderAutoLockSwitch = () => {
		const { autoLock } = this.state;
		const { Force_Screen_Lock } = this.props;
		return <Switch value={autoLock} onValueChange={this.toggleAutoLock} disabled={Force_Screen_Lock} />;
	};

	renderBiometrySwitch = () => {
		const { biometry, biometryBusy } = this.state;
		return <Switch value={biometry} onValueChange={this.toggleBiometry} disabled={biometryBusy} />;
	};

	renderAutoLockItems = () => {
		const { autoLock, autoLockTime } = this.state;
		const { Force_Screen_Lock_After, Force_Screen_Lock } = this.props;
		if (!autoLock) {
			return null;
		}
		let items: IItem[] = this.defaultAutoLockOptions;
		if (Force_Screen_Lock && Force_Screen_Lock_After > 0) {
			items = [
				{
					title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
					value: Force_Screen_Lock_After,
					disabled: true
				}
			];
			// if Force_Screen_Lock is disabled and autoLockTime is a value that isn't on our defaultOptions we'll show it
		} else if (Force_Screen_Lock_After === autoLockTime && !items.find(item => item.value === autoLockTime)) {
			items.push({
				title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
				value: Force_Screen_Lock_After
			});
		}
		return (
			<List.Section>
				<List.Separator />
				<>{items.map(item => this.renderItem({ item }))}</>
			</List.Section>
		);
	};

	renderBiometry = () => {
		const { autoLock, biometryLabel } = this.state;
		if (!autoLock || !biometryLabel) {
			return null;
		}
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title={I18n.t('Local_authentication_unlock_with_label', { label: biometryLabel })}
					right={() => this.renderBiometrySwitch()}
					translateTitle={false}
					additionalAccessibilityLabel={this.state.biometry ? I18n.t('Enabled') : I18n.t('Disabled')}
				/>
				<List.Separator />
			</List.Section>
		);
	};

	render() {
		const { autoLock } = this.state;
		const { Force_Screen_Lock } = this.props;
		return (
			<SafeAreaView testID='screen-lock-config-view'>
				<List.Container>
					<List.Section>
						<List.Separator />
						<List.Item
							testID='screen-lock-config-view-auto-lock'
							title='Local_authentication_unlock_option'
							right={() => this.renderAutoLockSwitch()}
							additionalAccessibilityLabel={autoLock}
							onPress={Force_Screen_Lock ? undefined : this.toggleAutoLock}
							disabled={Force_Screen_Lock}
							accessibilityRole='switch'
						/>
						{autoLock ? (
							<>
								<List.Separator />
								<List.Item
									title='Local_authentication_change_passcode'
									onPress={() => this.changePasscode({ force: false })}
									showActionIndicator
									testID='screen-lock-config-view-change-passcode'
								/>
							</>
						) : null}
						<List.Separator />
						<List.Info info='Local_authentication_info' />
					</List.Section>
					{this.renderBiometry()}
					{this.renderAutoLockItems()}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	Force_Screen_Lock: state.settings.Force_Screen_Lock as boolean,
	Force_Screen_Lock_After: state.settings.Force_Screen_Lock_After as number
});

export default connect(mapStateToProps)(withTheme(ScreenLockConfigView));
