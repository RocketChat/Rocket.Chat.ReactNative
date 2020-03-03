import React from 'react';
import {ScrollView} from "react-native";

export const InfiniteScrollView = ({ onEndReached, children, onScroll = () => null, ...props }) => (<ScrollView
    onScroll={(e) => {
        let paddingToBottom = 10;
        paddingToBottom += e.nativeEvent.layoutMeasurement.height;

        if(e.nativeEvent.contentOffset.y >= e.nativeEvent.contentSize.height - paddingToBottom) {
            onEndReached();
        }

        onScroll()!;
    }}
    {...props}>
    {children}
</ScrollView>);
