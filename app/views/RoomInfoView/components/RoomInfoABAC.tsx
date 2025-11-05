import { Text, View } from 'react-native';

import * as List from '../../../containers/List';
import styles from '../styles';
import { RoomInfoTag, RoomInfoTagContainer } from './RoomInfoTag';
import type { ISubscription } from '../../../definitions';
import { ItemLabel } from './ItemLabel';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';

export const RoomInfoABAC = ({
	abacAttributes,
	teamMain
}: {
	abacAttributes?: ISubscription['abacAttributes'];
	teamMain?: boolean;
}) => {
	const { colors } = useTheme();

	if (!abacAttributes?.length) {
		return null;
	}

	return (
		<View style={styles.item}>
			<List.Separator style={{ marginBottom: 20 }} />
			<View style={{ gap: 16 }}>
				<RoomInfoTagContainer>
					<RoomInfoTag name={I18n.t('ABAC_managed')} icon={teamMain ? 'team-shield' : 'hash-shield'} />
				</RoomInfoTagContainer>

				<Text style={[styles.abacDescription, { color: colors.fontSecondaryInfo }]}>{I18n.t('ABAC_managed_description')}</Text>

				<ItemLabel label={I18n.t('ABAC_room_attributes')} />
				{abacAttributes.map(attribute => (
					<View key={attribute.name} style={{ gap: 8 }}>
						<Text style={[styles.abacDescription, { color: colors.fontDefault }]}>{attribute.name}</Text>
						<RoomInfoTagContainer>
							{attribute.values.map(value => (
								<RoomInfoTag name={value} key={value} />
							))}
						</RoomInfoTagContainer>
					</View>
				))}
			</View>
		</View>
	);
};
