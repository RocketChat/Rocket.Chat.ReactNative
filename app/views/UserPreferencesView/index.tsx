import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import { compareServerVersion } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { getUserSelector } from '../../selectors/login';
import { type ProfileStackParamList } from '../../stacks/types';
import { saveUserPreferences, setUserPreferences, getUserPreferences } from '../../lib/services/restApi';
import { showToast } from '../../lib/methods/helpers/showToast';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import ListPicker from './ListPicker';
import Switch from '../../containers/Switch';
import { type IUser } from '../../definitions';
import { FormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';

interface IUserPreferencesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const { enableMessageParserEarlyAdoption, id, alsoSendThreadToChannel, settings } = useAppSelector(state =>
		getUserSelector(state)
	);
	const serverVersion = useAppSelector(state => state.server.version);
	const dispatch = useDispatch();
	const convertAsciiEmoji = settings?.preferences?.convertAsciiEmoji;
	const initialHighlightRef = useRef(settings?.preferences?.highlights?.join(', ') || '');
	const [highlights, setHighlights] = useState(initialHighlightRef.current);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		const initial = settings?.preferences?.highlights?.join(', ') || '';
		initialHighlightRef.current = initial;
		setHighlights(initial);
		setDirty(false);
	}, [settings?.preferences?.highlights]);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, [navigation]);

	const navigateToScreen = (screen: keyof ProfileStackParamList) => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		// @ts-ignore
		navigation.navigate(screen);
	};

	const toggleMessageParser = async (value: boolean) => {
		try {
			// optimistic update
			dispatch(setUser({ settings: { ...settings, preferences: { ...settings?.preferences, enableMessageParserEarlyAdoption: value } } } as Partial<IUser>));
			// send properly shaped payload (userId separate)
			await setUserPreferences(id, { enableMessageParserEarlyAdoption: value });
		} catch (e) {
			log(e);
		}
	};

	const toggleConvertAsciiToEmoji = async (value: boolean) => {
		try {
			dispatch(setUser({ settings: { ...settings, preferences: { convertAsciiEmoji: value } } } as Partial<IUser>));
			await saveUserPreferences({ convertAsciiEmoji: value });
		} catch (e) {
			log(e);
		}
	};

	const saveHighlights = async (value: string) => {
			try {
				const words = value.split(',').map(w => w.trim()).filter(w => w);
				const current = Array.isArray(settings?.preferences?.highlights)
					? settings.preferences.highlights.map((s: string) => (s || '').trim())
					: [];
				const unchanged = JSON.stringify(current) === JSON.stringify(words);
				if (unchanged && !dirty) {
					// No change, skip network/save and toasts
					return;
				}

				// optimistic update: merge highlights into existing preferences
					dispatch(setUser({
						settings: {
							...settings,
							preferences: {
								...settings?.preferences,
								highlights: words
							}
						}
					}));

				// attempt save and capture server response or error
				let saveRes: any;
				try {
					saveRes = await saveUserPreferences({ highlights: words });
					log({ saveUserPreferencesResponse: saveRes });
				} catch (err) {
					log(err);
					showToast(I18n.t('Highlights_save_failed'));
					return;
				}

				// verify server-side saved value and inform the user; normalize values to avoid ordering/spacing mismatches
				try {
					const result = await getUserPreferences(id);
					log({ getUserPreferencesResponse: result });
					if (result?.success && result?.preferences) {
						const saved: string[] = Array.isArray(result.preferences.highlights)
							? result.preferences.highlights.map((s: string) => (s || '').trim().toLowerCase())
							: [];
						const expected = words.map(w => w.trim().toLowerCase());
						const sortA = [...saved].sort();
						const sortB = [...expected].sort();
						if (JSON.stringify(sortA) === JSON.stringify(sortB)) {
							initialHighlightRef.current = value;
							setDirty(false);
							showToast(I18n.t('Highlights_saved_successfully'));
						} else {
							log({ highlightsMismatch: { saved, expected } });
							showToast(I18n.t('Highlights_save_failed'));
						}
					} else {
						showToast(I18n.t('Highlights_save_failed'));
					}
				} catch (err) {
					log(err);
					showToast(I18n.t('Highlights_save_failed'));
				}
			} catch (e) {
				log(e);
				showToast(I18n.t('Highlights_save_failed'));
			}
		};

	const setAlsoSendThreadToChannel = async (param: { [key: string]: string }, onError: () => void) => {
		try {
			await saveUserPreferences(param);
			// optimistic update merging into preferences
			dispatch(setUser({ settings: { ...settings, preferences: { ...settings?.preferences, ...param } } } as Partial<IUser>));
		} catch (e) {
			log(e);
			onError();
		}
	};

	return (
		<SafeAreaView testID='preferences-view'>
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Notifications'
						onPress={() => navigateToScreen('UserNotificationPrefView')}
						showActionIndicator
						testID='preferences-view-notifications'
					/>
					<List.Separator />
				</List.Section>
				{compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title='Enable_Message_Parser'
							testID='preferences-view-enable-message-parser'
							right={() => <Switch value={enableMessageParserEarlyAdoption} onValueChange={toggleMessageParser} />}
						/>
						<List.Separator />
					</List.Section>
				) : null}
				{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0') ? (
					<List.Section title='Also_send_thread_message_to_channel_behavior'>
						<List.Separator />
						<ListPicker
							onChangeValue={setAlsoSendThreadToChannel}
							preference='alsoSendThreadToChannel'
							value={alsoSendThreadToChannel}
							title='Message_composer_Send_to_channel'
							testID='preferences-view-enable-message-parser'
						/>
						<List.Separator />
						<List.Info info='Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description' />
					</List.Section>
				) : null}
				<List.Section>
					<List.Separator />
					<List.Item
						title='Convert_ASCII_to_emoji'
						testID='preferences-view-convert-ascii-to-emoji'
						right={() => <Switch value={convertAsciiEmoji} onValueChange={toggleConvertAsciiToEmoji} />}
						onPress={() => toggleConvertAsciiToEmoji(!convertAsciiEmoji)}
					/>
					<List.Separator />
				</List.Section>
				<List.Section>
					<List.Separator />
					<List.Item title='Highlights' testID='preferences-view-highlights' />
					<List.Separator />
					<FormTextInput
						value={highlights}
						onChangeText={value => {
						setHighlights(value);
						setDirty(value !== initialHighlightRef.current);
					}}
					// Call saveHighlights on blur; it internally checks dirty/changed
					onBlur={() => {
						saveHighlights(highlights);
					}}
					placeholder={I18n.t('Highlight_Words_Placeholder')}
					/>
					{dirty ? (
						<>
							<List.Separator />
							<Button
								title={I18n.t('Save')}
								small
								onPress={() => saveHighlights(highlights)}
								testID='preferences-view-highlights-save'
								style={{ alignSelf: 'center', marginTop: 15}}
							/>
						</>
					) : null}
					<List.Separator />
					<List.Info info='Highlights_Description' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default UserPreferencesView;
