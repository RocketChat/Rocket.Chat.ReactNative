import React, { Component } from "react";
import PropTypes from "prop-types";
import EStyleSheet from "react-native-extended-stylesheet";
import SearchBar from "react-native-searchbar";

import { ListStyles } from "../../styles/listStyles";

// base searchBar class
export default class TopSearchBar extends Component {
  state = {
    hideBack: true
    // isSearched: false
  };

  _handleSearch = () => {
    this.setState({
      hideBack: false
    });
    if (this.props.onSearch) {
      let searchResults = this.props.onSearch(
        this.searchBarRef.getValue().trim()
      );
      // this.setState({
      //   isSearched: true
      // });
    }
    return null;
  };

  _handleX = () => {
    this.setState({
      hideBack: true
      // isSearched: false
    });
  };

  _handleBack = () => {
    this.setState({
      hideBack: true
      // isSearched: false
    });
  };

  renderSearchbar() {
    return (
      <SearchBar
        ref={ref => (this.searchBarRef = ref)}
        placeholder={this.props.searchbarPlaceholder}
        hideBack={this.state.hideBack}
        iOSPadding={false}
        heightAdjust={styles.heightAdjust}
        showOnLoad={true}
        focusOnLayout={false}
        onSubmitEditing={this._handleSearch}
        onX={this._handleX}
        onBack={this._handleBack}
      />
    );
  }
}

TopSearchBar.defaultProps = {
  searchbarPlaceholder: "search"
};

TopSearchBar.propTypes = {
  onSearch: PropTypes.func,
  searchbarPlaceholder: PropTypes.string
};

const styles = EStyleSheet.create({
  ...ListStyles
});
