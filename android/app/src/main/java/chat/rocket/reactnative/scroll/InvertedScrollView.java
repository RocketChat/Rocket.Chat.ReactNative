package chat.rocket.reactnative.scroll;

import android.content.Context;
import android.view.FocusFinder;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import com.facebook.react.views.scroll.ReactScrollView;

/**
 * Custom ScrollView for inverted FlatLists that corrects keyboard navigation so it follows
 * the visual order instead of the inverted view-tree order.
 *
 * DPAD arrows are swapped unconditionally (stateless).
 * Tab/Shift+Tab are handled manually via requestFocus to avoid position-sort issues
 * with FOCUS_FORWARD/FOCUS_BACKWARD, and to allow clean exit at list boundaries.
 */
public class InvertedScrollView extends ReactScrollView {

  private boolean mTabConsumed = false;

  public InvertedScrollView(Context context) {
    super(context);
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    int keyCode = event.getKeyCode();

    if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN || keyCode == KeyEvent.KEYCODE_DPAD_UP) {
      int mapped = (keyCode == KeyEvent.KEYCODE_DPAD_DOWN)
          ? KeyEvent.KEYCODE_DPAD_UP
          : KeyEvent.KEYCODE_DPAD_DOWN;
      KeyEvent invertedEvent = new KeyEvent(
          event.getDownTime(), event.getEventTime(),
          event.getAction(), mapped,
          event.getRepeatCount(), event.getMetaState(),
          event.getDeviceId(), event.getScanCode(),
          event.getFlags(), event.getSource()
      );
      return super.dispatchKeyEvent(invertedEvent);
    }

    if (keyCode == KeyEvent.KEYCODE_TAB) {
      if (event.getAction() == KeyEvent.ACTION_DOWN) {
        return handleTabDown(event.isShiftPressed());
      }
      return mTabConsumed;
    }

    return super.dispatchKeyEvent(event);
  }

  private boolean handleTabDown(boolean isShiftPressed) {
    View focused = findFocus();
    if (focused == null) {
      mTabConsumed = false;
      return false;
    }

    int searchDir = isShiftPressed ? View.FOCUS_DOWN : View.FOCUS_UP;
    View next = FocusFinder.getInstance().findNextFocus(this, focused, searchDir);

    if (next != null && next != focused) {
      mTabConsumed = true;
      return next.requestFocus(searchDir);
    }

    int exitDir = isShiftPressed ? View.FOCUS_UP : View.FOCUS_DOWN;
    View exitTarget = findExitTarget(exitDir);
    if (exitTarget != null) {
      mTabConsumed = true;
      return exitTarget.requestFocus(exitDir);
    }

    mTabConsumed = true;
    return true;
  }

  private View findExitTarget(int direction) {
    View rootView = getRootView();
    if (!(rootView instanceof ViewGroup)) {
      return null;
    }
    View target = FocusFinder.getInstance()
        .findNextFocus((ViewGroup) rootView, this, direction);
    if (target != null && !isDescendantOf(target, this)) {
      return target;
    }
    return null;
  }

  private static boolean isDescendantOf(View view, ViewGroup ancestor) {
    ViewParent parent = view.getParent();
    while (parent != null) {
      if (parent == ancestor) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }
}
