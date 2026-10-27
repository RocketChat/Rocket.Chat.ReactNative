import { Fragment, useLayoutEffect, type ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import Switch from '~/containers/Switch';
import { useScreenLockConfig } from './hooks/useScreenLockConfig';

const ScreenLockConfigView = (): ReactElement => {
	const navigation = useNavigation();
	const { colors } = useTheme();
	const {
		autoLock,
		autoLockTime,
		autoLockOptions,
		biometry,
		biometryLabel,
		biometryBusy,
		forceScreenLock,
		toggleAutoLock,
		toggleBiometry,
		changeAutoLockTime,
		changePasscode
	} = useScreenLockConfig();

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Screen_lock') });
	}, [navigation]);

	return (
		<SafeAreaView testID='screen-lock-config-view'>
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						testID='screen-lock-config-view-auto-lock'
						title='Local_authentication_unlock_option'
						right={() => (
							<Switch
								testID='screen-lock-config-view-auto-lock-switch'
								value={autoLock}
								onValueChange={toggleAutoLock}
								disabled={forceScreenLock}
							/>
						)}
						additionalAccessibilityLabel={autoLock}
						onPress={() => toggleAutoLock(!autoLock)}
						disabled={forceScreenLock}
						accessibilityRole='switch'
					/>
					{autoLock ? (
						<>
							<List.Separator />
							<List.Item
								title='Local_authentication_change_passcode'
								onPress={changePasscode}
								showActionIndicator
								testID='screen-lock-config-view-change-passcode'
							/>
						</>
					) : null}
					<List.Separator />
					<List.Info info='Local_authentication_info' />
				</List.Section>
				{autoLock && biometryLabel ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title={I18n.t('Local_authentication_unlock_with_label', {
								label: biometryLabel
							})}
							right={() => (
								<Switch
									testID='screen-lock-config-view-biometry-switch'
									value={biometry}
									onValueChange={toggleBiometry}
									disabled={biometryBusy}
								/>
							)}
							translateTitle={false}
							additionalAccessibilityLabel={biometry ? I18n.t('Enabled') : I18n.t('Disabled')}
						/>
						<List.Separator />
					</List.Section>
				) : null}
				{autoLockOptions.length ? (
					<List.Section>
						<List.Separator />
						{autoLockOptions.map(({ title, value, disabled }) => (
							<Fragment key={value}>
								<List.Item
									title={title}
									onPress={() => changeAutoLockTime(value)}
									right={() => (autoLockTime === value ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : null)}
									disabled={disabled}
									translateTitle={false}
									additionalAccessibilityLabel={autoLockTime === value}
									additionalAccessibilityLabelCheck
									testID={`screen-lock-config-view-auto-lock-time-${value}`}
								/>
								<List.Separator />
							</Fragment>
						))}
					</List.Section>
				) : null}
			</List.Container>
		</SafeAreaView>
	);
};

export default ScreenLockConfigView;
