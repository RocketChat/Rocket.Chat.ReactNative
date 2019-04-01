import React from "react";
import { View, TextInput } from "react-native";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import i18n from "i18n-js";

import { setSearch } from "../../../actions/rooms";
import styles from "./styles";

@connect(
  null,
  dispatch => ({
    setSearch: searchText => dispatch(setSearch(searchText))
  })
)
export default class RoomsListSearchView extends React.Component {
  static propTypes = {
    setSearch: PropTypes.func
  };

  componentDidMount() {
    this.inputSearch.focus();
  }

  onSearchChangeText(text) {
    this.props.setSearch(text.trim());
  }

  render() {
    return (
      <View style={styles.header} testID="rooms-list-view-header">
        <TextInput
          ref={inputSearch => (this.inputSearch = inputSearch)}
          underlineColorAndroid="transparent"
          style={styles.inputSearch}
          onChangeText={text => this.onSearchChangeText(text)}
          returnKeyType="search"
          placeholder={i18n.t("ran.chat.Search")}
          placeholderTextColor="#eee"
          clearButtonMode="while-editing"
          blurOnSubmit
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    );
  }
}
