package chat.rocket.reactnative.scroll;

import android.content.Context;
import android.view.KeyEvent;
import com.facebook.react.views.scroll.ReactScrollView;


/**
 * Custom ScrollView for inverted FlatLists that remaps DPAD and Tab key events
 * so keyboard navigation follows the visual order instead of the inverted view-tree order.
 */
public class InvertedScrollView extends ReactScrollView {

  public InvertedScrollView(Context context) {
    super(context);
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    int keyCode = event.getKeyCode();
    boolean isShiftPressed = event.isShiftPressed();

    int mapped;
    switch (keyCode) {
      case KeyEvent.KEYCODE_DPAD_DOWN:
        mapped = KeyEvent.KEYCODE_DPAD_UP;
        break;
      case KeyEvent.KEYCODE_DPAD_UP:
        mapped = KeyEvent.KEYCODE_DPAD_DOWN;
        break;
      case KeyEvent.KEYCODE_TAB:
        mapped = isShiftPressed ? KeyEvent.KEYCODE_DPAD_DOWN : KeyEvent.KEYCODE_DPAD_UP;
        break;
      default:
        return super.dispatchKeyEvent(event);
    }

    KeyEvent invertedEvent = new KeyEvent(
      event.getDownTime(), event.getEventTime(),
      event.getAction(), mapped,
      event.getRepeatCount(), event.getMetaState(),
      event.getDeviceId(), event.getScanCode(),
      event.getFlags(), event.getSource()
    );
    return super.dispatchKeyEvent(invertedEvent);
  }
}
