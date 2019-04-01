import React from "react";
import {
  Text,
  View,
  ActivityIndicator,
  I18nManager as RNI18nManager
} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";

import Avatar from "../src/base/components/avatar/Avatar";

export default class Test extends React.Component {
  _onAvatarPress = () => {
    this.avatarRef.layout(this.avatarRef).then(layout => {
      console.log(layout);
    });
  };

  render() {
    const avatarProps = {
      avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
      defaultName: i18n.t("chatBaseList:top"),
      showName: true,
      // avatarContainerStyle: {
      //     width: 100,
      //     height: 100,
      // },
      avatarStyle: styles.avatarStyle
    };

    return (
      <View style={styles.container}>
        <Text>avatar show bellow.</Text>
        <Avatar
          ref={ref => (this.avatarRef = ref)}
          {...avatarProps}
          onAvatarPress={this._onAvatarPress}
        />
      </View>
    );
  }
}

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarStyle: {
    width: "5rem",
    height: "5rem"
  }
});
