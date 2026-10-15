import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import Avatar from '~/containers/Avatar';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IPreflightPeople {
	people: { _id: string; username: string }[];
}

const FACES_SHOWN = 10;
const FACE_SIZE = 24;

const styles = StyleSheet.create({
	people: {
		alignItems: 'center',
		gap: 8
	},
	faces: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 4
	},
	caption: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const PreflightPeople = ({ people }: IPreflightPeople): ReactElement | null => {
	const { colors } = useTheme();

	if (people.length === 0) {
		return null;
	}

	return (
		<View style={styles.people} testID='conference-preflight-people'>
			<Text style={[styles.caption, { color: colors.fontHint }]}>{I18n.t('People_in_the_call')}</Text>
			<View style={styles.faces}>
				{people.slice(0, FACES_SHOWN).map(user => (
					<Avatar key={user._id} avatar={`/avatar/uid/${user._id}`} text={user.username} size={FACE_SIZE} borderRadius={4} />
				))}
			</View>
		</View>
	);
};

export default PreflightPeople;
