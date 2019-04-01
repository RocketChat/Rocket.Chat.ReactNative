import React, { Component } from "react";
import { View, Keyboard } from "react-native";
import PropTypes from "prop-types";

import ScrollableTabView from "react-native-scrollable-tab-view";
import EStyleSheet from "react-native-extended-stylesheet";

export default class ScrollableTabScreen extends Component {
  _onChangeTab = tab => {
    Keyboard.dismiss();
    console.log("_onChangeTab :" + tab.i + "--" + tab.ref.ref);
  };

  getInnerComponentProps() {
    const { ...props } = this.props;
    return {
      ...props
    };
  }

  render() {
    const pageProps = this.getInnerComponentProps();

    return (
      <ScrollableTabView
        style={{ marginTop: EStyleSheet.value("$STATUSBAR_HEIGHT") }}
        initialPage={0}
        onChangeTab={this._onChangeTab}
        tabBarActiveTextColor={EStyleSheet.value("$DODERBLUE")}
        // tabBarBackgroundColor={EStyleSheet.value("$LIGHTGRAY")}
        tabBarUnderlineStyle={{
          backgroundColor: EStyleSheet.value("$DODERBLUE"),
          height: 1
        }}
        locked={true}
      >
        {React.Children.map(this.props.children, (child, index) => {
          return (
            <View
              tabLabel={this.props.tabLabels[index]}
              style={styles.tabView}
              ref={this.props.tabLabels[index]}
            >
              {child}
            </View>
          );
        })}
      </ScrollableTabView>
    );
  }
}

ScrollableTabScreen.propTypes = {
  scrollableTabViews: PropTypes.array
};

const styles = EStyleSheet.create({
  tabView: {
    flex: 1
  }
});
