package chat.rocket.reactnative.scroll;

import android.view.View;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.views.scroll.ReactScrollView;
import java.util.ArrayList;
import java.util.Collections;

// When a FlatList is inverted (inverted={true}), React Native uses scaleY: -1 transform which
// visually inverts the list but Android still reports children in array order. This view overrides
// addChildrenForAccessibility to reverse the order so TalkBack matches the visual order, and also
// adjusts keyboard/D-pad focus navigation to behave like a non-inverted list.

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
  public View focusSearch(View focused, int direction) {
    if (mIsInvertedVirtualizedList) {
      switch (direction) {
        case View.FOCUS_DOWN:
          direction = View.FOCUS_UP;
          break;
        case View.FOCUS_UP:
          direction = View.FOCUS_DOWN;
          break;
        case View.FOCUS_FORWARD:
          direction = View.FOCUS_BACKWARD;
          break;
        case View.FOCUS_BACKWARD:
          direction = View.FOCUS_FORWARD;
          break;
        default:
          break;
      }
    }
    return super.focusSearch(focused, direction);
  }

  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    super.addChildrenForAccessibility(outChildren);
    if (mIsInvertedVirtualizedList) {
      Collections.reverse(outChildren);
    }
  }
}
