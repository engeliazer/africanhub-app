
const RenderBasedOnAuthState = ({
   authState,
   compNoAuth,
   compAuth,
     }) => {
  return authState ? compAuth : compNoAuth;
};

export default RenderBasedOnAuthState;