import React, { useState, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '../../containers/Touch';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import Check from '../../containers/Check';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import styles from './styles';
import Switch from '../../containers/Switch';
import { useTheme } from '../../theme';

const FilterItem = ({
  itemType,
  selectedType,
  onPress,
  iconName,
  text,
}: {
  itemType: string;
  selectedType: string;
  onPress: () => void;
  iconName: TIconsName;
  text: string;
}) => {
  const { colors } = useTheme();

  return (
    <Touch onPress={onPress} style={styles.filterItemButton} accessibilityLabel={text} accessible>
      <View style={styles.filterItemContainer}>
        <CustomIcon name={iconName} size={22} color={colors.fontDefault} style={styles.filterItemIcon} />
        <Text style={[styles.filterItemText, { color: colors.fontDefault }]}>{text}</Text>
        {selectedType === itemType ? <Check /> : null}
      </View>
    </Touch>
  );
};

const DirectoryOptions = ({
  isFederationEnabled,
  toggleWorkspace,
}: IDirectoryOptionsProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState('channels');

  const renderItem = useMemo(() => {
    const items = [
      { type: 'channels', icon: 'channel-public', text: 'Channels' },
      { type: 'users', icon: 'user', text: 'Users' },
      { type: 'teams', icon: 'teams', text: 'Teams' },
    ];

    return (itemType: string) => {
      const item = items.find((i) => i.type === itemType);
      return (
        <FilterItem
          key={itemType}
          itemType={itemType}
          selectedType={type}
          onPress={() => setType(itemType)}
          iconName={item?.icon}
          text={I18n.t(item?.text)}
        />
      );
    };
  }, []);

  return (
    <View style={{ backgroundColor: colors.surfaceRoom, marginBottom: insets.bottom }}>
      <List.Separator />
      {renderItem('channels')}
      <List.Separator />
      {renderItem('users')}
      <List.Separator />
      {renderItem('teams')}
      <List.Separator />
      {isFederationEnabled ? (
        <>
          <List.Separator />
          <View style={[styles.filterItemContainer, styles.globalUsersContainer]}>
            <View style={styles.globalUsersTextContainer}>
              <Text style={[styles.filterItemText, { color: colors.fontHint }]}>{I18n.t('Search_global_users')}</Text>
              <Text style={[styles.filterItemDescription, { color: colors.fontHint }]}>
                {I18n.t('Search_global_users_description')}
              </Text>
            </View>
            <Switch value={globalUsers} onValueChange={toggleWorkspace} />
          </View>
        </>
      ) : null}
    </View>
  );
};

export default DirectoryOptions;