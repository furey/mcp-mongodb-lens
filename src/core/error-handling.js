import { JSONRPC_ERROR_CODES, log } from '../config/index.js'

export const withErrorHandling = async (operation, errorMessage, defaultValue = null) => {
  try {
    return await operation()
  } catch (error) {
    const formattedError = `${errorMessage}: ${error.message}`
    console.error(formattedError)
    log(formattedError)
    
    let errorCode = -32000
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 13) errorCode = -32041
      else if (error.code === 59 || error.code === 61) errorCode = -32050
      else if (error.code === 121) errorCode = -32052
      else errorCode = -32051
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      errorCode = -32040
    }
    
    const errorResponse = {
      content: [{
        type: 'text',
        text: formattedError
      }],
      isError: true,
      error: {
        code: errorCode,
        message: error.message,
        data: { type: error.name }
      }
    }
    
    return errorResponse
  }
}

export const createErrorResponse = (error, errorMessage) => {
  let errorCode = -32000
  
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if (error.code === 13) errorCode = -32041
    else if (error.code === 59 || error.code === 61) errorCode = -32050
    else if (error.code === 121) errorCode = -32052
    else errorCode = -32051
  } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
    errorCode = -32040
  }
  
  return {
    content: [{
      type: 'text',
      text: `${errorMessage}: ${error.message}`
    }],
    isError: true,
    error: {
      code: errorCode,
      message: error.message,
      data: { type: error.name }
    }
  }
}

export const throwIfCollectionNotExists = async (collectionExists, collectionName) => {
  if (!await collectionExists(collectionName)) {
    throw new Error(`Collection '${collectionName}' does not exist`)
  }
}