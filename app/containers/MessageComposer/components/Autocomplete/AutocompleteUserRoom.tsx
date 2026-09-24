import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import { type IAutocompleteUserRoom } from '~/containers/MessageComposer/interfaces';
import Avatar from '~/containers/Avatar';
import RoomTypeIcon from '~/containers/RoomTypeIcon';
import { fetchIsAllOrHere } from '~/containers/MessageComposer/helpers';
import I18n from '~/i18n';
import { useStyle } from './styles';

export const AutocompleteUserRoom = ({ item }: { item: IAutocompleteUserRoom }) => {
	const [styles] = useStyle();
	const isAllOrHere = fetchIsAllOrHere(item);

	return (
		<View style={styles.userRoomContainer}>
			{!isAllOrHere ? <Avatar rid={item.id} text={item.subtitle} size={36} type={item.t} /> : null}
			<View style={[styles.userRoom, { paddingLeft: isAllOrHere ? 0 : 12 }]}>
				<View style={styles.userRoomHeader}>
					{!isAllOrHere ? (
						<RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} teamMain={item.teamMain} />
					) : null}
					<View style={{ paddingLeft: isAllOrHere ? 0 : 2 }}>
						<PlainText style={styles.userRoomTitleText} numberOfLines={1}>
							{isAllOrHere ? `@${item.title}` : item.title}
						</PlainText>
					</View>
				</View>
				{item.type === '#' ? null : (
					<View style={styles.userRoomSubtitle}>
						<PlainText style={styles.userRoomSubtitleText}>{item.subtitle}</PlainText>
						{item.outside ? <PlainText style={styles.userRoomOutsideText}>{I18n.t('Not_in_channel')}</PlainText> : null}
					</View>
				)}
			</View>
		</View>
	);
};
