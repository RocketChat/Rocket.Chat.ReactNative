import React from 'react';
import { View, Text } from 'react-native';
import  * as List  from '../../../containers/List';
import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/Status';
import { getRoomAvatar, getRoomTitle } from '../../../lib/methods/helpers';
import { themes } from '../../../lib/constants/colors';
import sharedStyles from '../../Styles';
import styles from '../styles';
import { IRoom } from '../../../definitions';

type RoomInfoSectionProps = {
  room: IRoom;
  membersCount: number;
  canViewMembers: boolean;
  joined: boolean;
  navigation: any;
  isGroupChatHandler: boolean;
};

const RoomInfoSection: React.FC<RoomInfoSectionProps> = ({ room, membersCount, canViewMembers, joined, navigation, isGroupChatHandler }) => {
  const { rid, name, t, topic, source } = room;
  const avatar = getRoomAvatar(room);

  return (
    <List.Section>
      <List.Separator />
      <List.Item
        title={getRoomTitle(room)}
        subtitle={topic}
        left={() => (
          <Avatar text={avatar} size={50} type={t} rid={rid}>
            {t === 'd' && room.member?._id ? (
              <View style={[sharedStyles.status, { backgroundColor: themes.light.surfaceRoom }]}> {/* Adjust theme dynamically */}
                <Status size={16} id={room.member._id} />
              </View>
            ) : null}
          </Avatar>
        )}
        onPress={() => navigation.navigate('RoomInfoView', { rid, room })}
        testID='room-info-section'
      />
      <List.Separator />
    </List.Section>
  );
};

export default RoomInfoSection;