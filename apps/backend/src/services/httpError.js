function createHttpError(status, message, payload = null) {
    const error = new Error(message);
    error.status = status;
    error.payload = payload;
    return error;
}

module.exports = {
    createHttpError
};
