import React, {useState} from 'react';
import {FilterOption} from "../models/filter-option";
import i18n from "../i18n";
import {ContentType} from "../enums/content-type";
import {Dropdown} from "react-native-material-dropdown";
import {appColors} from "../theme/colors";
import {Image, Text, View, StyleSheet} from "react-native";

const styles = StyleSheet.create({
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'auto',
        margin: 'auto',
    },

    dropdown: {
        marginTop: 10,
        backgroundColor: appColors.light,
        width: 'auto',
        height: 'auto',
    },

    topBar: {
        height: '6%',
    },

    filterBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: appColors.lightPrimary,
    },
});

interface Props {
    value: ContentType|undefined;
    onChange: (filter: ContentType|undefined) => void;
}

export const Filter = ({ value = undefined, onChange = (filter) => {} }: Props) => {
    // Array of contenttypes that can be selected from
    const filterOptions: FilterOption[] = [
        { value: i18n.t('timeline.filterOptions.all') },
        { contentType: ContentType.TEXT, value: i18n.t('timeline.filterOptions.text') },
        { contentType: ContentType.IMAGE, value: i18n.t('timeline.filterOptions.image') },
        { contentType: ContentType.YOUTUBE, value: i18n.t('timeline.filterOptions.video') },
        { contentType: ContentType.LINK, value: i18n.t('timeline.filterOptions.link') },
    ];

    // Hook for filter state
    const [filterFocus, setFilterFocus] = useState(false);

    const filterIndex = filterOptions.findIndex(item => item.contentType === value);

    return <View style={[styles.topBar]}>
            <View style={[styles.filterBar]}>
            <Dropdown
                pickerStyle={[styles.dropdown]}
                textColor={appColors.text}
                baseColor={appColors.text}
                itemColor={appColors.text}
                rippleInsets={{ top: -5, bottom: 10, left: -10, right: -10 }}
                renderBase={(menu) =>
                    <View style={[styles.filterButton]}>
                        <Text style={[{ fontWeight: 'bold'}]}>{menu.value}</Text>
                        <Image style={[{ marginLeft: 5, transform: [{ rotate: filterFocus ? '180deg' : '0deg' }]} ]}
                               source={require('../assets/images/filter_arrow.png') } />
                    </View>}
                dropdownPosition={0}
                data={filterOptions}
                value={filterOptions[filterIndex].value}
                onChangeText={(value, index, data) => {
                    const type = filterOptions[index].contentType;

                    onChange(type);
                }}
                onFocus={() => setFilterFocus(true)}
                onBlur={() => setFilterFocus(false)}
            />
            </View>
        </View>
};
