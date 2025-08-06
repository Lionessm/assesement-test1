class HttpError extends Error {

constructor(statusCode, errorMessage) {
    super(errorMessage);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.errorMessage = errorMessage;
    }
}

class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

function buildErrorResponse(message, issues) {
    return {
        success: false,
        error: {
        message,
        issues,
        },
    };
}


function errorHandlerAlternative() {
    return (error, req, res, next) => {
        console.error(error);

        res.status(500).json(
        buildErrorResponse('Internal Server Error', [
            error.message,
        ])
        );
    };
}
  
module.exports = {
    HttpError,
    UnauthorizedError,
    buildErrorResponse,
    errorHandlerAlternative,
};
  