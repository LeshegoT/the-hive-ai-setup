import sinon from 'sinon';

export let fetch_stub = sinon.stub(window, 'fetch');

export let fetch_stub_returns_json = (thingy) => {
  let callback = () => {
    return Promise.resolve(thingy);
  };

  return fetch_stub.returns(
    Promise.resolve({
      json: callback,
      blob: callback,
      text: callback
    })
  );
};
