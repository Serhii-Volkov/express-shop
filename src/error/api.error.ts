//{
//  "error": {
//    "code": "VALIDATION_ERROR",
//    "message": "Validation failed",
//    "details": [
//      { "field": "email", "message": "Invalid email format" }
//    ]
//  }
//}
//
//| HTTP Code | Когда использовать |
//|-----------|-------------------|
//| 200 | GET успех |
//| 201 | POST создание |
//| 204 | Удаление / Logout |
//| 400 | Ошибка валидации |
//| 401 | Не аутентифицирован |
//| 403 | Нет прав |
//| 404 | Ресурс не найден |
//| 409 | Конфликт (email уже занят) |
//| 500 | Внутренняя ошибка сервера |

//*


export class ApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public details?: unknown // не смог типизировать
    ) {
        super(message);
    }

    static BadRequest(
        message: string,
        details?: unknown 
    ) {
        return new ApiError(
            400,
            "VALIDATION_ERROR",
            message,
            details
        );
    }

    static Unauthorized(
        message: string,
        details?: unknown
    ) {
        return new ApiError(
            401,
            "UNAUTHORIZED",
            message,
            details
        );
    }

    static Forbidden(
        message: string,
        details?: unknown
    ) {
        return new ApiError(
            403,
            "FORBIDDEN",
            message,
            details
        );
    }

    static NotFound(
        message: string,
        details?: unknown
    ) {
        return new ApiError(
            404,
            "NOT_FOUND",
            message,
            details
        );
    }
        
    //409

    static Conflict(
        message: string,
        details?: unknown
    ) {
        return new ApiError(
            409,
            "CONFLICT",
            message,
            details
        );
    }

    static Internal(
        message: string,
        details?: unknown
    ) {
        return new ApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            message,
            details
        );
    }

}