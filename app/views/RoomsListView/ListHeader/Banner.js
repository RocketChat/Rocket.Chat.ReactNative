import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import { E2E_BANNER_TYPE } from '../../../lib/encryption/constants';

const Banner = React.memo(
  ({
    searching,
    sortBy,
    toggleSort,
    isSort,
    encryptionBanner,
    goEncryption,
    theme,
  }) => {
    if (searching > 0 || (!encryptionBanner && !isSort)) {
      return null;
    }

    let text = isSort
      ? I18n.t('Sorting_by', {
          key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity'),
        })
      : I18n.t('Save_Your_Encryption_Password');

    if (!isSort && encryptionBanner === E2E_BANNER_TYPE.REQUEST_PASSWORD) {
      text = I18n.t('Enter_Your_E2E_Password');
    }

    const Children = () => (
      <>
        <CustomIcon
          name={isSort ? 'sort' : 'encrypted'}
          style={styles.bannerIcon}
          size={22}
          color={
            isSort ? themes[theme].auxiliaryText : themes[theme].buttonText
          }
        />
        <Text
          style={
            isSort
              ? [styles.sortToggleText, { color: themes[theme].auxiliaryText }]
              : [styles.encryptionText, { color: themes[theme].buttonText }]
          }
        >
          {text}
        </Text>
      </>
    );

    return isSort ? (
      <Touch
        onPress={toggleSort}
        theme={theme}
        style={{ backgroundColor: themes[theme].headerSecondaryBackground }}
      >
        <View
          style={[
            styles.dropdownContainerHeader,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderColor: themes[theme].separatorColor,
            },
          ]}
        >
          <Children />
        </View>
      </Touch>
    ) : (
      <BorderlessButton
        style={[
          styles.encryptionButton,
          { backgroundColor: themes[theme].actionTintColor },
        ]}
        theme={theme}
        onPress={goEncryption}
        testID='listheader-encryption'
        accessibilityLabel={text}
      >
        <Children />
      </BorderlessButton>
    );
  }
);

Banner.propTypes = {
  searching: PropTypes.bool,
  sortBy: PropTypes.string,
  theme: PropTypes.string,
  toggleSort: PropTypes.func,
  isSort: PropTypes.bool,
  encryptionBanner: PropTypes.string,
  goEncryption: PropTypes.func
};

export default withTheme(Banner);
