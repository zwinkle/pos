# backend/app/utils/custom_exceptions.py
# Belum diterapkan pada kode manapun, jadi jika ingin modular, bisa ditambahkan dan diedit untuk error/exception handling pada kode
from fastapi import HTTPException, status

class DetailHTTPException(HTTPException):
    """
    Custom HTTPException yang bisa menyertakan detail error tambahan.
    """
    def __init__(self, status_code: int, detail: str = None, internal_log_message: str = None, errors: dict = None):
        super().__init__(status_code=status_code, detail=detail)
        self.internal_log_message = internal_log_message # Untuk logging internal
        self.errors = errors # Untuk detail error per field, misalnya

# --- Contoh Custom Exceptions Spesifik ---
class EntityNotFoundException(DetailHTTPException):
    def __init__(self, entity_name: str, entity_id: any = None, detail: str = None):
        message = f"{entity_name} not found."
        if entity_id:
            message = f"{entity_name} with ID '{entity_id}' not found."
        if detail:
            message = detail
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        self.internal_log_message = message # Bisa ditambahkan info lain untuk log

class DuplicateEntryException(DetailHTTPException):
    def __init__(self, entity_name: str, conflicting_field: str, conflicting_value: any, detail: str = None):
        message = f"{entity_name} with {conflicting_field} '{conflicting_value}' already exists."
        if detail:
            message = detail
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

class InsufficientStockException(DetailHTTPException):
    def __init__(self, product_name: str, requested_qty: int, available_qty: int, detail: str = None):
        message = f"Insufficient stock for product '{product_name}'. Requested: {requested_qty}, Available: {available_qty}."
        if detail:
            message = detail
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

class AuthorizationException(DetailHTTPException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, headers={"WWW-Authenticate": "Bearer"})

class InvalidOperationException(DetailHTTPException):
    def __init__(self, detail: str = "Operation not allowed or invalid."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

# Anda bisa menambahkan lebih banyak custom exception sesuai kebutuhan
# Contoh: InvalidInputException, PaymentFailedException, dsb.