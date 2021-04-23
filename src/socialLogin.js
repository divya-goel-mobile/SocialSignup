import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';
import {Platform} from 'react-native';
import {GoogleSignin, statusCodes} from '@react-native-community/google-signin';
import {
  appleAuth,
  appleAuthAndroid,
} from '@invertase/react-native-apple-authentication';
import {v4 as uuid} from 'uuid';

let googleConfig = {
  webClientId:
    '995367775521-n7rfp6e63prej59bogsquk3uitig31u4.apps.googleusercontent.com',
  offlineAccess: true,
  // forceCodeForRefreshToken: true,
};
GoogleSignin.configure(googleConfig);

export const FBGraphRequest = async (fields, callBack) => {
  const accessData = await AccessToken.getCurrentAccessToken();
  // Create a graph request asking for user information
  const infoRequest = new GraphRequest(
    '/me',
    {
      accessToken: accessData.accessToken,
      parameters: {
        fields: {
          string: fields,
        },
      },
    },
    callBack,
  );
  // Execute the graph request created above
  new GraphRequestManager().addRequest(infoRequest).start();
};

export const FacebookLogin = async (responsecallBack) => {
  let result;
  try {
    if (Platform.OS === 'android') {
      LoginManager.setLoginBehavior('web_only');
    }
    let loginFBManager = LoginManager;
    loginFBManager.logOut();
    result = await loginFBManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);
    if (result.isCancelled) {
      return;
    }
    // Create a graph request asking for user information
    FBGraphRequest('id, email, name, picture.type(large)', responsecallBack);
  } catch (error) {
    return {error, responseType: 'error'};
  }
};

export const GoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return {isCode: true, result: userInfo, message: 'Success'};
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return {isCode: false, result: null, message: error.code};
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return {isCode: false, result: null, message: error.code};
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {isCode: false, result: null, message: error.code};
    } else {
      console.log('error.code======>', JSON.stringify(error));
      return {isCode: false, result: null, message: 'DEVELOPER_ERROR'};
    }
  }
};

export const AppleLogin = async () => {
  if (Platform.OS === 'ios') {
    if (appleAuth.isSupported) {
      try {
        const appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });
        return {result: appleAuthRequestResponse, message: 'Success'};
      } catch (error) {
        return {result: null, message: 'Failed'};
      }
    } else {
      return {result: null, message: 'Apple Sign in not supported'};
    }
  } else {
    // Generate secure, random values for state and nonce
    const rawNonce = uuid();
    const state = uuid();

    appleAuthAndroid.configure({
      // The Service ID you registered with Apple
      clientId: 'com.cmolds.Empowered.android',

      // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
      // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
      redirectUri:
        'https://empower-backend-qa.kiwi-internal.com/users/login/callback',

      // The type of response requested - code, id_token, or both.
      responseType: appleAuthAndroid.ResponseType.ALL,

      // The amount of user information requested from Apple.
      scope: appleAuthAndroid.Scope.ALL,

      // Random nonce value that will be SHA256 hashed before sending to Apple.
      nonce: rawNonce,

      // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
      state,
    });

    // Open the browser window for user sign in
    const appleAuthRequestResponse = await appleAuthAndroid.signIn();
    return {result: appleAuthRequestResponse, message: 'Success'};
  }
};
