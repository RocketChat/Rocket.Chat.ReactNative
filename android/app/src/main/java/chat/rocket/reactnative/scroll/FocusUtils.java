package chat.rocket.reactnative.scroll;

import android.view.View;
import android.view.ViewParent;
import chat.rocket.reactnative.R;

/**
 * Utilities for focus-related queries inside custom scroll views.
 */
public final class FocusUtils {

  private FocusUtils() {}

  public static boolean hasInvertedParent(View view) {
    if (view == null) {
      return false;
    }
    ViewParent parent = view.getParent();
    while (parent instanceof View) {
      View parentView = (View) parent;
      Object tag = parentView.getTag(R.id.tag_inverted_list);
      if (tag instanceof Boolean && (Boolean) tag) {
        return true;
      }
      parent = parentView.getParent();
    }
    return false;
  }
}

