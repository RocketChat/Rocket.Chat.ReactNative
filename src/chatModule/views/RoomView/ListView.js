// import { ListView as OldList } from "realm/react-native";
import React from "react";
import { ScrollView, FlatList, ImageBackground } from "react-native";
import moment from "moment";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import shallowequal from "shallowequal";

import Separator from "./Separator";
import styles from "./styles";
import Typing from "../../containers/Typing";
import database from "../../../main/ran-db/sqlite";
import scrollPersistTaps from "../../utils/scrollPersistTaps";
import throttle from "../../utils/throttle";

const DEFAULT_SCROLL_CALLBACK_THROTTLE = 100;

export class List extends React.Component {
  static propTypes = {
    onEndReached: PropTypes.func,
    renderFooter: PropTypes.func,
    renderRow: PropTypes.func,
    room: PropTypes.string,
    end: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      data: []
    };

    this.dataToken = null;
    // this.dataSource = ds.cloneWithRows(this.data);
  }

  async componentDidMount() {
    if (!this.dataToken) {
      await this.updateData();
      this.dataToken = PubSub.subscribe("messages", this.updateData);
    }
  }

  updateData = async () => {
    setTimeout(async () => {
      let data = await database.objects(
        "messages",
        `WHERE rid="${this.props.room}" ORDER BY datetime("ts") DESC`
      );
      if (!shallowequal(this.state.data, data.slice())) {
        this.setState({ data: data.slice() });
      }
    }, 1000);
  };

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowequal(this.state.data, nextState) ||
      this.props.end !== nextProps.end
    );
  }
  componentWillUnmount() {
    this.removeListener(this.dataToken);
  }

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  render() {
    const { data } = this.state;

    return (
      <FlatList
        style={styles.list}
        data={data}
        keyExtractor={item => item._id}
        onEndReachedThreshold={100}
        ListFooterComponent={this.props.renderFooter}
        ListHeaderComponent={() => <Typing />}
        onEndReached={() => this.props.onEndReached(data[data.length - 1])}
        renderItem={({ item, index }) =>
          this.props.renderRow(item, data[index + 1])
        }
        initialListSize={1}
        pageSize={20}
        testID="room-view-messages"
        {...scrollPersistTaps}
      />
    );
  }
}

// @connect(state => ({
//   lastOpen: state.room.lastOpen
// }))
// export class ListView extends OldList2 {
//   constructor(props) {
//     super(props);
//     this.state = {
//       curRenderedRowsCount: 10
//       // highlightedRow: ({}: Object)
//     };
//   }

//   getInnerViewNode() {
//     return this.refs.listView.getInnerViewNode();
//   }

//   scrollTo(...args) {
//     this.refs.listView.scrollTo(...args);
//   }

//   setNativeProps(props) {
//     this.refs.listView.setNativeProps(props);
//   }
//   // static DataSource = DataSource;
//   render() {
//     const bodyComponents = [];

//     // const stickySectionHeaderIndices = [];

//     // const { renderSectionHeader } = this.props;

//     const header = this.props.renderHeader ? this.props.renderHeader() : null;
//     const footer = this.props.renderFooter ? this.props.renderFooter() : null;
//     // let totalIndex = header ? 1 : 0;

//     const { data } = this.props;
//     let count = 0;

//     for (
//       let i = 0;
//       i < this.state.curRenderedRowsCount && i < data.length;
//       i += 1, count += 1
//     ) {
//       const message = data[i];
//       const previousMessage = data[i + 1];
//       bodyComponents.push(this.props.renderRow(message, previousMessage));

//       if (!previousMessage) {
//         bodyComponents.push(
//           <Separator key={message.ts.toISOString()} ts={message.ts} />
//         );
//         continue; // eslint-disable-line
//       }

//       const showUnreadSeparator =
//         this.props.lastOpen &&
//         moment(message.ts).isAfter(this.props.lastOpen) &&
//         moment(previousMessage.ts).isBefore(this.props.lastOpen);
//       const showDateSeparator = !moment(message.ts).isSame(
//         previousMessage.ts,
//         "day"
//       );

//       if (showUnreadSeparator || showDateSeparator) {
//         bodyComponents.push(
//           <Separator
//             key={message.ts.toISOString()}
//             ts={showDateSeparator ? message.ts : null}
//             unread={showUnreadSeparator}
//           />
//         );
//       }
//     }

//     const { ...props } = this.props;
//     if (!props.scrollEventThrottle) {
//       props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
//     }
//     if (props.removeClippedSubviews === undefined) {
//       props.removeClippedSubviews = true;
//     }
//     /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
//      * suppresses an error found when Flow v0.54 was deployed. To see the error
//      * delete this comment and run Flow. */
//     Object.assign(props, {
//       onScroll: this._onScroll,
//       /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
//        * comment suppresses an error when upgrading Flow's support for React.
//        * To see the error delete this comment and run Flow. */
//       // stickyHeaderIndices: this.props.stickyHeaderIndices.concat(stickySectionHeaderIndices,),

//       // Do not pass these events downstream to ScrollView since they will be
//       // registered in ListView's own ScrollResponder.Mixin
//       onKeyboardWillShow: undefined,
//       onKeyboardWillHide: undefined,
//       onKeyboardDidShow: undefined,
//       onKeyboardDidHide: undefined
//     });

//     const image = data.length === 0 ? { uri: "message_empty" } : null;
//     return [
//       <ImageBackground
//         key="listview-background"
//         source={image}
//         style={styles.imageBackground}
//       />,
//       <ScrollView
//         key="listview-scroll"
//         ref={this._setScrollComponentRef}
//         onContentSizeChange={this._onContentSizeChange}
//         onLayout={this._onLayout}
//         {...props}
//       >
//         {header}
//         {bodyComponents}
//         {footer}
//       </ScrollView>
//     ];
//   }
// }
// ListView.DataSource = DataSource;
