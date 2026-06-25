import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import * as List from '../containers/List';
import database from '../lib/database';
import {
	changePasscode,
	checkHasPasscode,
	supportedBiometryLabel,
	handleLocalAuthentication
} from '../lib/methods/helpers/localAuthentication';
import { BIOMETRY_ENABLED_KEY, DEFAULT_AUTO_LOCK } from '../lib/constants/localAuthentication';
import SafeAreaView from '../containers/SafeAreaView';
import { events, logEvent } from '../lib/methods/helpers/log';
import userPreferences from '../lib/methods/userPreferences';
import { type TServerModel } from '../definitions';
import Switch from '../containers/Switch';
import { type SettingsStackParamList } from '../stacks/types';
import { useAppSelector } from '../lib/hooks/useAppSelector';

const DEFAULT_BIOMETRY = false;

interface IItem {
	title: string;
	value: number;
	disabled?: boolean;
}

const defaultAutoLockOptions: IItem[] = [
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

const ScreenLockConfigView = (): ReactElement => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'ScreenLockConfigView'>>();
	const { colors } = useTheme();

	const server = useAppSelector(state => state.server.server);
	const Force_Screen_Lock = useAppSelector(state => state.settings.Force_Screen_Lock as boolean);
	const Force_Screen_Lock_After = useAppSelector(state => state.settings.Force_Screen_Lock_After as number);

	const serverRecord = useRef<TServerModel | undefined>(undefined);

	const [autoLock, setAutoLock] = useState(false);
	const [autoLockTime, setAutoLockTime] = useState<number | null>(null);
	const [biometry, setBiometry] = useState(DEFAULT_BIOMETRY);
	const [biometryLabel, setBiometryLabel] = useState<string | null>(null);

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Screen_lock') });
	}, [navigation]);

	useEffect(() => {
		const init = async () => {
			try {
				serverRecord.current = await database.servers.get('servers').find(server);
				setAutoLock(serverRecord.current?.autoLock ?? false);
				setAutoLockTime(
					serverRecord.current?.autoLockTime === null ? DEFAULT_AUTO_LOCK : serverRecord.current?.autoLockTime ?? null
				);
				setBiometry(userPreferences.getBool(BIOMETRY_ENABLED_KEY) ?? DEFAULT_BIOMETRY);
			} catch {
				// noop
			}
			setBiometryLabel(await supportedBiometryLabel());
		};
		init();
	}, [server]);

	const save = async (nextAutoLock: boolean, nextAutoLockTime: number | null) => {
		logEvent(events.SLC_SAVE_SCREEN_LOCK);
		await database.servers.write(async () => {
			await serverRecord.current?.update(record => {
				record.autoLock = nextAutoLock;
				record.autoLockTime = nextAutoLockTime === null ? DEFAULT_AUTO_LOCK : nextAutoLockTime;
			});
		});
	};

	const toggleAutoLock = async () => {
		logEvent(events.SLC_TOGGLE_AUTOLOCK);
		const nextAutoLock = !autoLock;
		setAutoLock(nextAutoLock);
		setAutoLockTime(DEFAULT_AUTO_LOCK);
		if (nextAutoLock) {
			try {
				await checkHasPasscode({ force: false });
				setBiometry(userPreferences.getBool(BIOMETRY_ENABLED_KEY) ?? DEFAULT_BIOMETRY);
			} catch {
				setAutoLock(false);
				setAutoLockTime(DEFAULT_AUTO_LOCK);
				await save(false, DEFAULT_AUTO_LOCK);
				return;
			}
		}
		await save(nextAutoLock, DEFAULT_AUTO_LOCK);
	};

	const toggleBiometry = () => {
		logEvent(events.SLC_TOGGLE_BIOMETRY);
		const nextBiometry = !biometry;
		setBiometry(nextBiometry);
		userPreferences.setBool(BIOMETRY_ENABLED_KEY, nextBiometry);
	};

	const isSelected = (value: number) => autoLockTime === value;

	const changeAutoLockTime = (nextAutoLockTime: number) => {
		logEvent(events.SLC_CHANGE_AUTOLOCK_TIME);
		setAutoLockTime(nextAutoLockTime);
		save(autoLock, nextAutoLockTime);
	};

	const handleChangePasscode = async ({ force }: { force: boolean }) => {
		if (autoLock) {
			await handleLocalAuthentication(true);
		}
		logEvent(events.SLC_CHANGE_PASSCODE);
		await changePasscode({ force });
	};

	const renderIcon = () => <List.Icon name='check' color={colors.badgeBackgroundLevel2} />;

	const renderItem = ({ item }: { item: IItem }) => {
		const { title, value, disabled } = item;
		return (
			<Fragment key={value}>
				<List.Item
					title={title}
					onPress={() => changeAutoLockTime(value)}
					right={() => (isSelected(value) ? renderIcon() : null)}
					disabled={disabled}
					translateTitle={false}
					additionalAccessibilityLabel={isSelected(value)}
					additionalAccessibilityLabelCheck
				/>
				<List.Separator />
			</Fragment>
		);
	};

	const renderAutoLockSwitch = () => (
		<Switch
			testID='screen-lock-config-auto-lock-switch'
			value={autoLock}
			onValueChange={toggleAutoLock}
			disabled={Force_Screen_Lock}
		/>
	);

	const renderBiometrySwitch = () => (
		<Switch testID='screen-lock-config-biometry-switch' value={biometry} onValueChange={toggleBiometry} />
	);

	const renderAutoLockItems = () => {
		if (!autoLock) {
			return null;
		}
		let items: IItem[] = [...defaultAutoLockOptions];
		if (Force_Screen_Lock && Force_Screen_Lock_After > 0) {
			items = [
				{
					title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
					value: Force_Screen_Lock_After,
					disabled: true
				}
			];
		} else if (Force_Screen_Lock_After === autoLockTime && !items.find(item => item.value === autoLockTime)) {
			items.push({
				title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
				value: Force_Screen_Lock_After
			});
		}
		return (
			<List.Section>
				<List.Separator />
				<>{items.map(item => renderItem({ item }))}</>
			</List.Section>
		);
	};

	const renderBiometry = () => {
		if (!autoLock || !biometryLabel) {
			return null;
		}
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title={I18n.t('Local_authentication_unlock_with_label', { label: biometryLabel })}
					right={() => renderBiometrySwitch()}
					translateTitle={false}
					additionalAccessibilityLabel={biometry ? I18n.t('Enabled') : I18n.t('Disabled')}
				/>
				<List.Separator />
			</List.Section>
		);
	};

	return (
		<SafeAreaView>
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Local_authentication_unlock_option'
						right={() => renderAutoLockSwitch()}
						additionalAccessibilityLabel={autoLock}
					/>
					{autoLock ? (
						<>
							<List.Separator />
							<List.Item title='Local_authentication_change_passcode' onPress={handleChangePasscode} showActionIndicator />
						</>
					) : null}
					<List.Separator />
					<List.Info info='Local_authentication_info' />
				</List.Section>
				{renderBiometry()}
				{renderAutoLockItems()}
			</List.Container>
		</SafeAreaView>
	);
};

export default ScreenLockConfigView;
