package chat.rocket.reactnative.scroll;

import android.content.Context;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.Nullable;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import com.facebook.react.views.scroll.ReactScrollView;
import java.util.HashMap;
import java.util.Map;

/**
 * Custom ScrollView for inverted FlatLists that corrects keyboard navigation so it follows
 * the visual order instead of the inverted view-tree order.
 *
 * Both Tab/Shift+Tab and DPAD arrows navigate between FlatList cells (direct children of the
 * content view) to avoid loops caused by inner focusable elements within a single message.
 * Boundary exit uses ReactFindViewUtil to find a tagged exit-target view by nativeID.
 */
public class InvertedScrollView extends ReactScrollView {

  private final Map<Integer, Boolean> mKeyConsumedMap = new HashMap<>();
  private volatile @Nullable String mExitFocusNativeId;

  public InvertedScrollView(Context context) {
    super(context);
  }

  public void setExitFocusNativeId(@Nullable String nativeId) {
    mExitFocusNativeId = nativeId;
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    int keyCode = event.getKeyCode();

    if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN
        || keyCode == KeyEvent.KEYCODE_DPAD_UP
        || keyCode == KeyEvent.KEYCODE_TAB) {
      if (event.getAction() == KeyEvent.ACTION_DOWN) {
        boolean isForward = keyCode == KeyEvent.KEYCODE_TAB
            ? !event.isShiftPressed()
            : (keyCode == KeyEvent.KEYCODE_DPAD_DOWN);
        boolean consumed = handleCellNavigation(isForward);
        mKeyConsumedMap.put(keyCode, consumed);
        return consumed;
      }
      if (event.getAction() == KeyEvent.ACTION_UP) {
        Boolean consumed = mKeyConsumedMap.remove(keyCode);
        return consumed != null && consumed;
      }
    }

    return super.dispatchKeyEvent(event);
  }

  /**
   * Shared navigation logic for Tab and DPAD.
   * @param isForward true = visual down (Tab / DPAD_DOWN), false = visual up (Shift+Tab / DPAD_UP)
   */
  private boolean handleCellNavigation(boolean isForward) {
    View focused = findFocus();
    if (focused == null || getChildCount() == 0) {
      return false;
    }

    View firstChild = getChildAt(0);
    if (!(firstChild instanceof ViewGroup)) {
      return false;
    }
    ViewGroup contentView = (ViewGroup) firstChild;
    int cellIndex = findContainingCellIndex(contentView, focused);
    if (cellIndex < 0) {
      return false;
    }

    int step = isForward ? -1 : 1;
    int focusDir = isForward ? View.FOCUS_UP : View.FOCUS_DOWN;

    for (int i = cellIndex + step; i >= 0 && i < contentView.getChildCount(); i += step) {
      View cell = contentView.getChildAt(i);
      if (cell != null && cell.getVisibility() == VISIBLE && cell.requestFocus(focusDir)) {
        return true;
      }
    }

    View exitTarget = findExitTarget();
    if (exitTarget != null) {
      exitTarget.requestFocus();
      return true;
    }

    return false;
  }

  private int findContainingCellIndex(ViewGroup contentView, View focused) {
    View current = focused;
    while (current != null && current.getParent() != contentView) {
      ViewParent p = current.getParent();
      if (p instanceof View) {
        current = (View) p;
      } else {
        return -1;
      }
    }
    return current != null ? contentView.indexOfChild(current) : -1;
  }

  private View findExitTarget() {
    if (mExitFocusNativeId != null) {
      return ReactFindViewUtil.findView(getRootView(), mExitFocusNativeId);
    }
    return null;
  }
}
