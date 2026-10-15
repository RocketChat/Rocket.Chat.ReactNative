import { type ReactElement, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import Button from '~/containers/Button';
import { CustomIcon } from '~/containers/CustomIcon';
import Switch from '~/containers/Switch';
import { FormTextInput } from '~/containers/TextInput';
import Touch from '~/containers/Touch';
import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useDebounce } from '~/lib/methods/helpers';
import { isInVideoConference } from '~/lib/methods/helpers/isInVideoConference';
import log from '~/lib/methods/helpers/log';
import { showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { showToast } from '~/lib/methods/helpers/showToast';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { usersAutoComplete, videoConferenceAddParticipants } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceSheetHeader from './ConferenceSheetHeader';
import ConferenceUserRow from './ConferenceUserRow';

type TCandidate = { _id: string; name?: string; username: string };

const RING_RECIPIENTS_LIMIT = 10;

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	form: {
		paddingHorizontal: 24
	},
	ring: {
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	ringLabel: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20
	}
});

const findCandidates = async (term: string, exceptions: string[]): Promise<TCandidate[]> => {
	const trimmed = term.trim();
	if (!trimmed) {
		return [];
	}
	try {
		const response = await usersAutoComplete({ term: trimmed, exceptions });
		return response.success
			? response.items.flatMap(({ _id, name, username }) => (username ? [{ _id, name, username }] : []))
			: [];
	} catch (error) {
		log(error);
		return [];
	}
};

const AddParticipantsSheetContent = (): ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const callId = useConferenceCallStore(state => state.callId);
	const selfUsername = useAppSelector(state => state.login.user.username);
	const { info } = useConferenceInfo(callId);
	const [canRing] = usePermissions(['videoconf-ring-users'], info?.rid);
	const [term, setTerm] = useState('');
	const [results, setResults] = useState<TCandidate[]>([]);
	const [selected, setSelected] = useState<TCandidate[]>([]);
	const [ring, setRing] = useState(true);
	const [adding, setAdding] = useState(false);

	const exceptions = [
		...(selfUsername ? [selfUsername] : []),
		...(info?.users ?? []).filter(isInVideoConference).map(({ username }) => username)
	];
	const tooMany = selected.length > RING_RECIPIENTS_LIMIT;

	const search = useDebounce(async (value: string, except: string[]) => {
		setResults(await findCandidates(value, except));
	}, textInputDebounceTime);

	const onChangeTerm = (value: string) => {
		setTerm(value);
		search(value, exceptions);
	};

	const toggle = (candidate: TCandidate) => {
		setSelected(current =>
			current.some(({ _id }) => _id === candidate._id)
				? current.filter(({ _id }) => _id !== candidate._id)
				: [...current, candidate]
		);
	};

	const add = async () => {
		if (!callId) {
			return;
		}
		setAdding(true);
		try {
			const response = await videoConferenceAddParticipants(
				callId,
				selected.map(({ username }) => username),
				canRing && ring
			);
			if (!response.success) {
				setAdding(false);
				return;
			}
			showToast(response.added.length ? I18n.t('Users_added') : I18n.t('Selected_users_are_already_in_the_call'));
			hideActionSheet();
		} catch (error) {
			showErrorAlertWithEMessage(error);
			setAdding(false);
		}
	};

	const candidates = [...selected, ...results.filter(({ _id }) => !selected.some(selection => selection._id === _id))];

	const renderCandidate = ({ item }: { item: TCandidate }) => {
		const isSelected = selected.some(({ _id }) => _id === item._id);
		return (
			<Touch
				onPress={() => toggle(item)}
				accessibilityLabel={item.name || item.username}
				accessibilityState={{ selected: isSelected }}
				testID={`conference-add-candidate-${item.username}`}>
				<ConferenceUserRow userId={item._id} name={item.name} username={item.username}>
					{isSelected ? <CustomIcon name='check' size={20} color={colors.fontInfo} /> : null}
				</ConferenceUserRow>
			</Touch>
		);
	};

	return (
		<View style={styles.container} testID='conference-add-people-sheet'>
			<ConferenceSheetHeader title={I18n.t('Add_people')} onClose={hideActionSheet} />
			<View style={styles.form}>
				<FormTextInput
					iconRight='search'
					placeholder={I18n.t('Choose_users')}
					value={term}
					onChangeText={onChangeTerm}
					autoCapitalize='none'
					autoCorrect={false}
					error={tooMany ? I18n.t('Add_at_most__limit__people_at_a_time', { limit: RING_RECIPIENTS_LIMIT }) : undefined}
					testID='conference-add-people-search'
				/>
				{canRing ? (
					<View style={styles.ring}>
						<Switch value={ring} onValueChange={setRing} testID='conference-add-people-ring' />
						<Text style={[styles.ringLabel, { color: colors.fontDefault }]}>{I18n.t('Ring_people')}</Text>
					</View>
				) : null}
				<Button
					title={I18n.t('Add')}
					onPress={add}
					loading={adding}
					disabled={!selected.length || tooMany}
					testID='conference-add-people-confirm'
				/>
			</View>
			<FlatList
				data={candidates}
				keyExtractor={({ _id }) => _id}
				renderItem={renderCandidate}
				keyboardShouldPersistTaps='handled'
			/>
		</View>
	);
};

export default AddParticipantsSheetContent;
