import React from "react";
import Avatar from "../src/base/components/avatar/Avatar";
import renderer from "react-test-renderer";

it("renders correctly", () => {
  const avatarProps = {
    avatar: "https://jestjs.io/img/jest.svg", //'https://img3.doubanio.com/img/fmadmin/large/31905.jpg',
    name: "jestjs",
    showName: true,
    showNameLength: 100,
    avatarStyle: {
      width: 60,
      height: 60
    }
  };

  const tree = renderer.create(<Avatar {...avatarProps} />).toJSON();
  expect(tree).toMatchSnapshot();
});

// it('renders as an anchor when no page is set', () => {
//     const tree = renderer.create(<Link>Facebook</Link>).toJSON();
//     expect(tree).toMatchSnapshot();
// });

// it('properly escapes quotes', () => {
//     const tree = renderer
//         .create(<Link>{"\"Facebook\" \\'is \\ 'awesome'"}</Link>)
//         .toJSON();
//     expect(tree).toMatchSnapshot();
// });

// it('changes the class when hovered', () => {
//     const component = renderer.create(
//         <Link page="http://www.facebook.com">Facebook</Link>
//     );
//     let tree = component.toJSON();
//     expect(tree).toMatchSnapshot();

//     // manually trigger the callback
//     tree.props.onMouseEnter();
//     // re-rendering
//     tree = component.toJSON();
//     expect(tree).toMatchSnapshot();

//     // manually trigger the callback
//     tree.props.onMouseLeave();
//     // re-rendering
//     tree = component.toJSON();
//     expect(tree).toMatchSnapshot();
// });
