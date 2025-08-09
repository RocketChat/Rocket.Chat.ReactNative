import React, { useState } from 'react';
import { View, Text, Modal, Platform, ScrollView, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Touchable from 'react-native-platform-touchable';

import { useTheme } from '../../../theme';
import I18n from '../../../i18n';
import Button from '../../Button';
import sharedStyles from '../../../views/Styles';
import { themes } from '../../../lib/constants';
import { TIMESTAMP_FORMATS, formatTimestamp, createTimestampString, ITimestampFormat } from '../../../lib/helpers/timestampUtils';

interface ITimestampPickerProps {
    onInsert: (timestamp: string) => void;
    onClose: () => void;
}

export const TimestampPicker = ({ onInsert, onClose }: ITimestampPickerProps) => {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedFormat, setSelectedFormat] = useState<ITimestampFormat>(TIMESTAMP_FORMATS[0]);
    const [showInlineDatePicker, setShowInlineDatePicker] = useState(false);
    const [showInlineTimePicker, setShowInlineTimePicker] = useState(false);
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);

    const handleCloseModal = () => {
        onClose(); 
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android' || event.type === 'set') { 
            setShowInlineDatePicker(false);
        }
        if (date) {
            setSelectedDate(prev => {
                const newDate = new Date(prev);
                newDate.setFullYear(date.getFullYear());
                newDate.setMonth(date.getMonth());
                newDate.setDate(date.getDate());
                return newDate;
            });
        }
    };

    const handleTimeChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android' || event.type === 'set') {
            setShowInlineTimePicker(false);
        }
        if (date) {
            setSelectedDate(prev => {
                const newDate = new Date(prev);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                newDate.setSeconds(date.getSeconds());
                return newDate;
            });
        }
    };

    const handleInsert = () => {
        const timestampString = createTimestampString(selectedDate, selectedFormat.value);
        onInsert(timestampString);
        handleCloseModal();
    };

    const preview = formatTimestamp(selectedDate, selectedFormat.value);

    const toggleDatePicker = () => {
        if (showInlineTimePicker) {
            setShowInlineTimePicker(false);
        }
        if (showFormatDropdown) {
            setShowFormatDropdown(false);
        }
        setShowInlineDatePicker(!showInlineDatePicker);
    };

    const toggleTimePicker = () => {
        if (showInlineDatePicker) {
            setShowInlineDatePicker(false);
        }
        if (showFormatDropdown) {
            setShowFormatDropdown(false);
        }
        setShowInlineTimePicker(!showInlineTimePicker);
    };

    const handleFormatSelect = () => {
        setShowInlineDatePicker(false);
        setShowInlineTimePicker(false);
        setShowFormatDropdown(!showFormatDropdown);
    };

    const selectFormat = (format: ITimestampFormat) => {
        setSelectedFormat(format);
        setShowFormatDropdown(false); 
    };

    return (
        <Modal
            visible={true}
            animationType='slide'
            presentationStyle='fullScreen'
            onRequestClose={onClose}
        >
            <SafeAreaView style={[sharedStyles.container, { backgroundColor: themes[theme].surfaceLight }]}>
                <View style={[
                    sharedStyles.separatorBottom,
                    {
                        backgroundColor: themes[theme].surfaceLight,
                        paddingVertical: 16,
                        borderBottomColor: themes[theme].strokeLight
                    }
                ]}>
                    <Text style={[
                        sharedStyles.textSemibold,
                        sharedStyles.textAlignCenter,
                        { color: themes[theme].fontTitlesLabels }
                    ]}>
                        {I18n.t('Add_Date_And_Time')}
                    </Text>
                </View>

                <ScrollView 
                    style={[sharedStyles.containerScrollView, { paddingHorizontal: 16 }]}
                    keyboardShouldPersistTaps='always'
                >
                    <View style={{ marginTop: 16 }}>
                        <Text style={[
                            sharedStyles.textMedium,
                            { color: themes[theme].fontTitlesLabels, marginBottom: 8 }
                        ]}>
                            {I18n.t('Date')}
                        </Text>
                        <Button
                            title={selectedDate.toLocaleDateString()}
                            type='secondary'
                            onPress={toggleDatePicker}
                        />

                        {showInlineDatePicker && (
                            <View style={{ marginTop: 12 }}>
                                <DateTimePicker
                                    value={selectedDate}
                                    mode='date'
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    textColor={themes[theme].fontTitlesLabels}
                                    style={Platform.OS === 'ios' ? { height: 180, alignSelf: 'center', width: '100%' } : undefined}
                                />
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <Text style={[
                            sharedStyles.textMedium,
                            { color: themes[theme].fontTitlesLabels, marginBottom: 8 }
                        ]}>
                            {I18n.t('Time')}
                        </Text>
                        <Button
                            title={selectedDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })}
                            type='secondary'
                            onPress={toggleTimePicker}
                        />

                        {showInlineTimePicker && (
                            <View style={{ marginTop: 12 }}>
                                <DateTimePicker
                                    value={selectedDate}
                                    mode='time'
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeChange}
                                    textColor={themes[theme].fontTitlesLabels}
                                    style={Platform.OS === 'ios' ? { height: 180, alignSelf: 'center', width: '100%' } : undefined}
                                />
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <Text style={[
                            sharedStyles.textMedium,
                            { color: themes[theme].fontTitlesLabels, marginBottom: 8 }
                        ]}>
                            {I18n.t('Format')}
                        </Text>
                        <Button
                            title={selectedFormat.label}
                            type='secondary'
                            onPress={handleFormatSelect}
                        />
                        
                        {showFormatDropdown && (
                            <View style={{
                                backgroundColor: themes[theme].surfaceRoom,
                                borderRadius: 4,
                                marginTop: 4,
                                borderWidth: 1,
                                borderColor: themes[theme].strokeLight,
                                maxHeight: 200
                            }}>
                                <ScrollView 
                                    bounces={false}
                                    keyboardShouldPersistTaps='always'
                                    nestedScrollEnabled={true}
                                >
                                    {TIMESTAMP_FORMATS.map((format, index) => (
                                        <Touchable 
                                            key={index}
                                            onPress={() => selectFormat(format)}
                                            style={{
                                                padding: 12,
                                                borderBottomWidth: index < TIMESTAMP_FORMATS.length - 1 ? 1 : 0,
                                                borderBottomColor: themes[theme].strokeLight,
                                                backgroundColor: selectedFormat.value === format.value 
                                                    ? themes[theme].surfaceSelected 
                                                    : 'transparent'
                                            }}
                                        >
                                            <Text style={{ 
                                                color: themes[theme].fontDefault,
                                                fontSize: 16,
                                                fontWeight: selectedFormat.value === format.value ? '600' : 'normal'
                                            }}>
                                                {format.label}
                                            </Text>
                                        </Touchable>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 24, marginBottom: 32 }}>
                        <Text style={[
                            sharedStyles.textMedium,
                            { color: themes[theme].fontTitlesLabels, marginBottom: 8 }
                        ]}>
                            {I18n.t('Preview')}
                        </Text>
                        <View
                            style={{
                                backgroundColor: themes[theme].surfaceRoom,
                                borderRadius: 4,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: themes[theme].strokeLight
                            }}
                        >
                            <Text style={[
                                sharedStyles.textRegular,
                                { color: themes[theme].fontSecondaryInfo }
                            ]}>
                                {preview}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View
                    style={[
                        sharedStyles.separatorTop,
                        {
                            borderTopColor: themes[theme].strokeLight,
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            backgroundColor: themes[theme].surfaceLight
                        }
                    ]}
                >
                    <Button
                        title={I18n.t('Cancel')}
                        type='secondary'
                        onPress={handleCloseModal}
                        style={{ flex: 1, marginRight: 8 }}
                    />
                    <Button
                        title={I18n.t('Add')}
                        type='primary'
                        onPress={handleInsert}
                        style={{ flex: 1 }}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};