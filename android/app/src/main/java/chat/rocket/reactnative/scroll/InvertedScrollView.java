package chat.rocket.reactnative.scroll;

import android.view.View;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.views.scroll.ReactScrollView;
import java.util.ArrayList;
import java.util.Collections;

// When a FlatList is inverted (inverted={true}), React Native uses scaleY: -1 transform which
// visually inverts the list but Android still reports children in array order. This view overrides
// addChildrenForAccessibility to reverse the order so TalkBack matches the visual order.

public class InvertedScrollView extends ReactScrollView {

  private boolean mIsInvertedVirtualizedList = false;

  public InvertedScrollView(ReactContext context) {
    super(context);
  }

  // Set whether this ScrollView is used for an inverted virtualized list. When true, we reverse the
  // accessibility traversal order to match the visual order.
  public void setIsInvertedVirtualizedList(boolean isInverted) {
    mIsInvertedVirtualizedList = isInverted;
  }

  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    super.addChildrenForAccessibility(outChildren);
    if (mIsInvertedVirtualizedList) {
      Collections.reverse(outChildren);
    }
  }

  @Override
  public void addFocusables(ArrayList<View> views, int direction, int focusableMode) {
    super.addFocusables(views, direction, focusableMode);
    if (mIsInvertedVirtualizedList) {
      Collections.reverse(views);
    }
  }
}
