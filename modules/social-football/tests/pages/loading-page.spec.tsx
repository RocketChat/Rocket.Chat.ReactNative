import React from 'react';
import {shallow} from 'enzyme';
import LoadingPage from "../../src/pages/LoadingPage";
import {ActivityIndicator} from "react-native";

describe('<LoadingPage />', () => {
    it('should run without errors', () => {
        const component = shallow(<LoadingPage />);

        expect(component.find(ActivityIndicator)).toHaveLength(1);
    });
});
