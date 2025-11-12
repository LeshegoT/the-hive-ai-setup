import authService from './auth.service';

let handle_error = (error) => {
  if (window.appInsights) {
    window.appInsights.trackTrace({ message: error.message });
  }
  throw error;
};

let get = async (url, additional_headers) => {
  url = url.includes('#') ? url.replace(/#/g, encodeURIComponent('#')) : url;
  const headers = await authService.getIdTokenHeaders(additional_headers);
  return fetch(url, { method: 'GET', headers }).catch(handle_error);
};

let post = async (url, request, additional_headers) => {
  url = url.includes('#') ? url.replace(/#/g, encodeURIComponent('#')) : url;
  let body = JSON.stringify(request);
  let headers = await authService.getIdTokenHeaders(additional_headers);
  return  fetch(url, { method: 'POST', body, headers }).catch(handle_error);
};

const putBinary = async (url, blob, additional_headers) => {
  let headers = await authService.getIdTokenHeadersForFileUpload(additional_headers);
  return fetch(url, { method: 'PUT', body: blob, headers }).catch(handle_error);
};

const postFileUpload = async (url, file, additional_headers) => {
  let headers = await authService.getIdTokenHeadersForFileUpload(additional_headers, false);
  return fetch(url, { method: 'POST', body: file, headers }).catch(handle_error);
};

let patch = async (url, request, additional_headers) => {
  let body = JSON.stringify(request);
  let headers = await authService.getIdTokenHeaders(additional_headers);
  return fetch(url, { method: 'PATCH', body, headers }).catch(handle_error);
};

let del = async (url, request, additional_headers) => {
  let body = JSON.stringify(request);
  let headers = await authService.getIdTokenHeaders(additional_headers);
  return fetch(url, { method: 'DELETE', body, headers }).catch(handle_error);
};

export { get, post, putBinary, patch, del, postFileUpload};
