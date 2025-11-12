class ConfigService {
  constructor() {
    this._config = {};
    this._loaded = false;
    this._callbacks = [];
  }

  async loadConfig() {
    return fetch('/api/config/config.json')
      .then(resp => resp.json())
      .then(json => {
        let conf = { ...json };
        conf.API_URL = conf.BASE_SERVER_URL + conf.API_URL;
        if (conf.DEBUG) {
          console.debug(conf);
        }
        return conf;
      });
  }

  registerCallback(callback, name) {
    if (this._loaded) {
      if (this.config.DEBUG) {
        console.info(`Config already loaded, invoking '${name}' callback imediately`);
      }
      callback(this.config);
    } else {
      this._callbacks.push({ callback, name });
    }
  }

  initializeConfig() {
    if (!this._loaded) {
      return this.loadConfig()
        .then(conf => {
          this._config = conf;
          this._loaded = true;
          if (conf.DEBUG) {
            console.info("Config has been loaded into service", conf);
            console.info(`Calling ${this._callbacks.length} callbacks`);
          }
          this._callbacks.forEach(cb => {
            if (conf.DEBUG) {
              console.info(`Config loaded, invoking '${cb.name}' callback now`);
            }
            cb.callback(this.config);
          });
        }).catch(e => {
          console.error("Error while loading config", e);
        });
    }
    return null;
  }

  get config() {
    return this._config;
  }

  get loaded() {
    return this._loaded;
  }

  get hiveApiUrl() {
    return this.config.API_URL;
  }

  get eventsApiUrl() {
    return this.config.EVENT_SERVER_URL;
  }

  get graphApi() {
    return this.config.MSGRAPHAPI;
  }

  get scopes() {
    return this.config.SCOPES;
  }

  get debug() {
    return this.config.DEBUG;
  }

  get baseUrl() {
    return this.config.BASE_SERVER_URL;
  }

  get refreshTimeout() {
    return this.config.REFRESH_TIMEOUT;
  }

  get storageAccountBaseUrl() {
    return this.config.STORAGE_ACCOUNT_BASE_URL;
  }

  get eventImagesStorageContainer() {
    return this.config.EVENT_IMAGES_STORAGE_CONTAINER;
  }

  get maximumImageUploadFileSize() {
    return this.config.MAXIMUM_IMAGE_FILE_SIZE_MB;
  }

  get feedbackFormDebounceThresholdInMilliseconds() {
    return this.config.FEEDBACK_FORM_DEBOUNCE_THRESHOLD_IN_MILLISECONDS;
  }

  get maximumFileSize() {
    return this.config.MAXIMUM_FILE_SIZE_MB;
  }

  get skillsFileDefault() {
    return this.config.SKILL_FILE_DEFAULT;
  }
  
  get skillMaxCharacterLimit() {
    return this.config.SKILL_MAX_CHARACTER_LIMIT;
  }

  get skillCertificationExpiryThreshold() {
    return this.config.SKILL_CERTIFICATION_EXPIRY_THRESHOLD;
  }

  get minimumContractDuration() {
    return this.config.MINIMUM_CONTRACT_DURATION;
  }

  get skillMinSearchCharacters() {
    return this.config.SKILL_MIN_SEARCH_CHARACTERS;
  }

  get searchDebounceTimeInMilliseconds() {
    return this.config.SEARCH_DEBOUNCE_TIME_IN_MILLISECONDS;
  }
}

export default new ConfigService();