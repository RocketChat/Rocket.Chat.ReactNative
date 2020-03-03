import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {TimelineItem} from "../../src/components/TimelineItem";
import { Text } from 'react-native';
import {ThreadModel} from "../../src/models/threads";
import {ContentType} from "../../src/enums/content-type";

describe('<TimelineItem />', () => {
    it('should run without errors', () => {
        const item: ThreadModel = {
            _id: '',
            type: ContentType.TEXT,
            title: 'Thread titel',
            description: 'Thread beschrijving.'
        } as any;

        const component = mount(<TimelineItem item={item} />);
        const text = component.find(Text);

        expect(component.text()).toContain(item.title);
        expect(component.text()).toContain(item.description);
    });
});
