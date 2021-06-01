const { device } = require('detox');

export default device.getPlatform() === 'android' ? {
    //Android types
    alertButtonType: 'android.widget.Button',
    scrollViewType: 'android.widget.ScrollView',
    textInputType: 'android.widget.EditText',
} : {
    //iOS types
    alertButtonType: '_UIAlertControllerActionView',
    scrollViewType: 'UIScrollView',
    textInputType: '_UIAlertControllerTextField'
};