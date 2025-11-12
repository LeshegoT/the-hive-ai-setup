export const NOT_LOGGED_IN = "NOT_LOGGED_IN";
export const LOGGED_IN = "LOGGED_IN"

function covnertEmailToUserId(username){
  const cleanId = username.replace(/[,;=| ]+/g, "_");
  let split = cleanId.split('@');
  if(split.length>1){
    return split[0];
  } else {
    return cleanId;
  }
}

export const loggedIn = (accessToken) => {
  if(window.appInsights){
    var userId = covnertEmailToUserId(accessToken.username);
    window.appInsights.setAuthenticatedUserContext(userId, accessToken.localAccountId);
  }
  return {
    type: LOGGED_IN
  }
}

export const loggedOut = (error) => {
  if (window.appInsights) {
    window.appInsights.clearAuthenticatedUserContext();
  }
  return {
    type: NOT_LOGGED_IN
  }
}