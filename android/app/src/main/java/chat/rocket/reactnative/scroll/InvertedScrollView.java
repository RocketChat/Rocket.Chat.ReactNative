package chat.rocket.reactnative.scroll;

import android.content.Context;
import android.view.View;
import android.view.accessibility.AccessibilityManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.views.scroll.ReactScrollView;
import java.util.ArrayList;
import java.util.Collections;

// When a FlatList is inverted (inverted={true}), React Native uses scaleY: -1 transform which
// visually inverts the list but Android still reports children in array order. This view overrides
// addChildrenForAccessibility to reverse the order so TalkBack matches the visual order when a
// screen reader is active.

public class InvertedScrollView extends ReactScrollView {

  private boolean mIsInvertedVirtualizedList = false;

  public InvertedScrollView(ReactContext context) {
    super(context);
  }

  // Set whether this ScrollView is used for an inverted virtualized list. When true and a screen
  // reader is enabled, we reverse the accessibility traversal order to match the visual order.
  public void setIsInvertedVirtualizedList(boolean isInverted) {
    mIsInvertedVirtualizedList = isInverted;
  }

  private boolean isScreenReaderEnabled() {
    AccessibilityManager manager =
        (AccessibilityManager) getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
    if (manager == null) {
      return false;
    }
    // Touch exploration is a strong signal that a screen reader like TalkBack is active.
    return manager.isEnabled() && manager.isTouchExplorationEnabled();
  }

  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    super.addChildrenForAccessibility(outChildren);
    if (mIsInvertedVirtualizedList && isScreenReaderEnabled()) {
      Collections.reverse(outChildren);
    }
  }
}
