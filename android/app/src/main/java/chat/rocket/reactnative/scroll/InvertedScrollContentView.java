package chat.rocket.reactnative.scroll;

import android.view.View;
import com.facebook.react.views.view.ReactViewGroup;
import java.util.ArrayList;
import java.util.Collections;

/**
 * Content view for inverted FlatLists. Reports its children to accessibility in reversed order so
 * TalkBack traversal matches the visual order (newest-first) when used inside InvertedScrollView.
 */
public class InvertedScrollContentView extends ReactViewGroup {

  private boolean mIsInvertedContent = false;

  public InvertedScrollContentView(android.content.Context context) {
    super(context);
  }

  public void setIsInvertedContent(boolean isInverted) {
    mIsInvertedContent = isInverted;
  }

  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    super.addChildrenForAccessibility(outChildren);
    if (mIsInvertedContent) {
      Collections.reverse(outChildren);
    }
  }

  @Override
  public void addFocusables(ArrayList<View> views, int direction, int focusableMode) {
    super.addFocusables(views, direction, focusableMode);
    if (mIsInvertedContent) {
      Collections.reverse(views);
    }
  }
}
