from fastapi import HTTPException, status


class BaseAPIException(Exception):
    """Base exception for API errors"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(BaseAPIException):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(BaseAPIException):
    """Authorization related errors"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(BaseAPIException):
    """Resource not found errors"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class ValidationError(BaseAPIException):
    """Validation errors"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictError(BaseAPIException):
    """Resource conflict errors"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status.HTTP_409_CONFLICT)


# Job specific exceptions
class JobNotFoundError(NotFoundError):
    """Job not found error"""
    def __init__(self, message: str = "Job not found"):
        super().__init__(message)


class InvalidJobTransitionError(ValidationError):
    """Invalid job status transition error"""
    def __init__(self, message: str = "Invalid job status transition"):
        super().__init__(message)


class JobAlreadyAssignedError(ConflictError):
    """Job already assigned error"""
    def __init__(self, message: str = "Job is already assigned"):
        super().__init__(message)


# Wallet specific exceptions
class WalletNotFoundError(NotFoundError):
    """Wallet not found error"""
    def __init__(self, message: str = "Wallet not found"):
        super().__init__(message)


class InsufficientFundsError(ValidationError):
    """Insufficient funds error"""
    def __init__(self, message: str = "Insufficient funds"):
        super().__init__(message)


class TransactionError(BaseAPIException):
    """Transaction related errors"""
    def __init__(self, message: str = "Transaction failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


# User specific exceptions
class UserNotFoundError(NotFoundError):
    """User not found error"""
    def __init__(self, message: str = "User not found"):
        super().__init__(message)


class UserAlreadyExistsError(ConflictError):
    """User already exists error"""
    def __init__(self, message: str = "User already exists"):
        super().__init__(message)


# Offer specific exceptions
class OfferNotFoundError(NotFoundError):
    """Offer not found error"""
    def __init__(self, message: str = "Offer not found"):
        super().__init__(message)


class OfferAlreadyExistsError(ConflictError):
    """Offer already exists error"""
    def __init__(self, message: str = "Offer already exists"):
        super().__init__(message)


# Rating specific exceptions
class RatingNotFoundError(NotFoundError):
    """Rating not found error"""
    def __init__(self, message: str = "Rating not found"):
        super().__init__(message)


class RatingAlreadyExistsError(ConflictError):
    """Rating already exists error"""
    def __init__(self, message: str = "Rating already exists"):
        super().__init__(message)


# Complaint specific exceptions
class ComplaintNotFoundError(NotFoundError):
    """Complaint not found error"""
    def __init__(self, message: str = "Complaint not found"):
        super().__init__(message)


class ComplaintAlreadyResolvedError(ConflictError):
    """Complaint already resolved error"""
    def __init__(self, message: str = "Complaint is already resolved"):
        super().__init__(message)


# Database specific exceptions
class DatabaseError(BaseAPIException):
    """Database operation error"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExternalServiceError(BaseAPIException):
    """External service error"""
    def __init__(self, message: str = "External service error"):
        super().__init__(message, status.HTTP_502_BAD_GATEWAY)
