import logging
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        logger.error(f"API Error: {exc.__class__.__name__}: {str(exc)}")
        logger.error(f"Response data: {response.data}")
    
    return response
