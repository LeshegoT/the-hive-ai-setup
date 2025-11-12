class StandardRestErrorResponse {
  constructor(errorMessage) {
    this.errorMessage = errorMessage;
    this.success = false;
  }
}

module.exports = {
  StandardRestErrorResponse,
};
