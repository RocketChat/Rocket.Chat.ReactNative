package chat.rocket.reactnative.scroll;

import android.content.Context;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.Nullable;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import com.facebook.react.views.scroll.ReactScrollView;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VisualOrderScrollView extends ReactScrollView {

  private static final Comparator<View> TOP_TO_BOTTOM = Comparator.comparingInt(VisualOrderScrollView::screenTop);

  private final Map<Integer, Boolean> mKeyConsumedMap = new HashMap<>();
  private volatile @Nullable String mExitFocusNativeId;

  public VisualOrderScrollView(Context context) {
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

  private boolean handleCellNavigation(boolean isForward) {
    View focused = findFocus();
    if (focused == null || getChildCount() == 0) {
      return false;
    }

    View cell = findContainingCell(getChildAt(0), focused);
    if (cell == null) {
      return false;
    }

    List<View> cells = visibleCellsTopToBottom((ViewGroup) cell.getParent());
    int step = isForward ? 1 : -1;
    int focusDirection = isForward ? View.FOCUS_DOWN : View.FOCUS_UP;

    for (int i = cells.indexOf(cell) + step; i >= 0 && i < cells.size(); i += step) {
      if (cells.get(i).requestFocus(focusDirection)) {
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

  private @Nullable View findContainingCell(View contentView, View focused) {
    View current = focused;
    while (current != null) {
      ViewParent parent = current.getParent();
      if (!(parent instanceof View)) {
        return null;
      }
      if (parent.getParent() == contentView) {
        return current;
      }
      current = (View) parent;
    }
    return null;
  }

  private List<View> visibleCellsTopToBottom(ViewGroup cellsParent) {
    List<View> cells = new ArrayList<>();
    for (int i = 0; i < cellsParent.getChildCount(); i++) {
      View child = cellsParent.getChildAt(i);
      if (child.getVisibility() == VISIBLE) {
        cells.add(child);
      }
    }
    cells.sort(TOP_TO_BOTTOM);
    return cells;
  }

  private @Nullable View findExitTarget() {
    if (mExitFocusNativeId != null) {
      return ReactFindViewUtil.findView(getRootView(), mExitFocusNativeId);
    }
    return null;
  }

  private static int screenTop(View view) {
    int[] location = new int[2];
    view.getLocationOnScreen(location);
    return location[1];
  }
}
