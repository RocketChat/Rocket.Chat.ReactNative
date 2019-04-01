import React, { Component } from "react";
import { View, FlatList, Text, TouchableHighlight } from "react-native";
import PropTypes from "prop-types";
import EStyleSheet from "react-native-extended-stylesheet";
import { FontAwesome } from "@expo/vector-icons";

import IntroductionItem from "../../introductionItem/IntroductionItem";
import { ListStyles } from "../../../styles/listStyles";

export default class PhoneMediaList extends Component {
  constructor(props) {
    super(props);
  }

  _onItemPress = item => {
    if (this.props.onItemPress) {
      this.props.onItemPress(item);
    }
  };

  renderAngleRight() {
    return (
      <FontAwesome
        name="angle-right"
        size={32}
        color={"black"}
        style={{ marginRight: 8 }}
      />
    );
  } //chevron-right

  renderItem = ({ item, index }) => {
    const { onItemPress } = this.props;

    return (
      <TouchableHighlight
        disabled={onItemPress ? false : true}
        onPress={() => this._onItemPress(item)}
      >
        <View style={styles.cell1}>
          <IntroductionItem
            showName={false}
            avatarContainerStyle={styles.avatarContainerStyle}
            avatarStyle={styles.avatarStyle}
            textStyle={styles.avatarTextStyle}
            introInfoStyle={styles.introInfoStyle}
            mainTitleStyle={styles.mainTitleStyle}
            numberOfMainTitleLines={1}
            infoStyle={styles.infoStyle}
            numberOfInfoLines={1}
            avatar={item.value.photo}
            mainTitle={item.key}
            info={item.count.toString()}
          />
          {this.renderAngleRight()}
        </View>
      </TouchableHighlight>
    );
  };

  render() {
    return (
      <FlatList
        style={styles.container}
        data={this.props.phoneMediaList}
        renderItem={this.renderItem}
        keyExtractor={item => item.key}
      />
    );
  }
}

PhoneMediaList.defaultProps = {
  phoneMediaList: []
};

PhoneMediaList.propTypes = {
  phoneMediaList: PropTypes.array
};

const styles = EStyleSheet.create({
  ...ListStyles
});
