
let config;

async function getConfig() {
  if(config) {
    return config;
  } else {
    const configResponse = await fetch("/api/config.json");
    config = await configResponse.json();
    return config;
  }
}

async function log(...args) {
  const config = await getConfig();
  if(config.PRODUCTION) {
    // Do not log in production.
  } else {
    console.log(...args);
  }
}