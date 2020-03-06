import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {InfiniteScrollView} from "../../src/components/InfiniteScrollView";
import {Text, TouchableOpacity, ActivityIndicator, ScrollView} from 'react-native';

describe('<InfiniteScrollView />', () => {
    it('should trigger an event when it reaches the bottom', () => {
        const fn = jest.fn();

        const component = shallow(<InfiniteScrollView onEndReached={fn} onScroll={() => null}>
            <Text>Scroll view</Text>
        </InfiniteScrollView>);
        const scrollView = component.find(ScrollView);

        const event = {
            nativeEvent: {
                contentOffset: {
                    y: 0,
                },
                contentSize: {
                    height: 95,
                },
                layoutMeasurement: {
                    height: 100,
                }
            },
        };

        scrollView.props().onScroll(event);

        expect(fn).toHaveBeenCalled();
    });

    it('should not trigger an event when it not at the bottom', () => {
        const fn = jest.fn();

        const component = shallow(<InfiniteScrollView onEndReached={fn}>
            <Text>Scroll view</Text>
        </InfiniteScrollView>);
        const scrollView = component.find(ScrollView);

        const event = {
            nativeEvent: {
                contentOffset: {
                    y: 50,
                },
                contentSize: {
                    height: 95,
                },
                layoutMeasurement: {
                    height: 30,
                }
            },
        };

        scrollView.props().onScroll(event);

        expect(fn).not.toHaveBeenCalled();
    });
});
