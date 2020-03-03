import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {ContentTypeButton} from "../../src/components/ContentTypeButton";
import {ContentType} from "../../src/enums/content-type";
import {Image, TouchableOpacity} from "react-native";

describe('<ContentTypeButton />', () => {
    it.each(Object.values(ContentType))('should run without errors for content type %s', (type) => {
        const spy = jest.fn();
        const component = shallow(<ContentTypeButton
            onPress={spy}
            type={type} />);

        const touchableOpacity = component.find(TouchableOpacity);

        expect(touchableOpacity).toHaveLength(1);
        expect(component.find(Image)).toHaveLength(2);

        touchableOpacity.props().onPress();

        expect(spy).toHaveBeenCalled();
    });
    it.each(Object.values(ContentType))('should run without errors for content type %s and active state', (type) => {
        const spy = jest.fn();
        const component = shallow(<ContentTypeButton
            onPress={spy}
            type={type}
            active={true} />);

        expect(component.find(Image)).toHaveLength(2);
    });
});
