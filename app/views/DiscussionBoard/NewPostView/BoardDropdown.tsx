import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

import PopUpModal from '../Components/PopUpModal';
import { BoardDropdownModalProps } from './interfaces';
import { getColor } from '../helpers';
import { withTheme } from '../../../theme';
import IconOrAvatar from '../../../containers/RoomItem/IconOrAvatar';
import { IApplicationState } from '../../../definitions';
import { useAppSelector } from '../../../lib/hooks';
import { getUidDirectMessage } from '../../../lib/methods/helpers';

const screenHeight = Dimensions.get('window').height;

const BoardDropdownModal: React.FC<BoardDropdownModalProps> = ({ show, close, data, onSelect }) => {
	const { displayMode, showAvatar } = useSelector((state: IApplicationState) => state.sortPreferences);
	const activeUsers = useAppSelector(state => state.activeUsers);

	return (
		<PopUpModal show={show} close={close}>
			<Text style={styles.title}>Select Discussion Board</Text>
			<ScrollView style={styles.mainContainer}>
				{data?.map((item, index) => {
					const id = getUidDirectMessage(item);
					const userStatus = activeUsers[id || '']?.status;
					const status = item.t === 'l' ? item.visitor?.status || item.v?.status : userStatus;
					return (
						<TouchableOpacity style={styles.boardContainer} key={index} onPress={() => onSelect(item)}>
							<View style={{ ...styles.iconContainer, backgroundColor: getColor(item.color) }}>
								<IconOrAvatar
									displayMode={displayMode}
									avatar={item.avatar}
									type={item.t}
									rid={item.rid}
									showAvatar={showAvatar}
									prid={item.prid}
									status={status}
									isGroupChat={item.isGrouChat}
									teamMain={item.teamMain}
									showLastMessage={false}
									displayMode={displayMode}
									sourceType={item.source}
									iconSize={40}
									borderRadius={10}
								/>
							</View>
							<Text>{item.title}</Text>
						</TouchableOpacity>
					);
				})}
				<View style={styles.spacer} />
			</ScrollView>
		</PopUpModal>
	);
};

export default withTheme(BoardDropdownModal);

const styles = StyleSheet.create({
	mainContainer: {
		width: '100%',
		maxHeight: screenHeight * 0.6,
		padding: 20
	},
	title: {
		fontWeight: '400'
	},
	boardContainer: {
		backgroundColor: '#fff',
		padding: 10,
		marginBottom: 2,
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 25,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 5
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10
	},
	icon: {
		height: 20,
		width: 20
	},
	spacer: {
		height: 20
	}
});
