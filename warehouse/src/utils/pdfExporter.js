/**
 * General PDF Export Utility
 * Handles PDF file generation and download
 */

/**
 * Export PDF file
 * @param {string} url - API endpoint URL
 * @param {Object} queryParams - Query parameters
 * @param {string} filename - Download filename
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @param {Function} onComplete - Complete callback (regardless of success or failure)
 */
export const exportPDF = async (url, queryParams = {}, filename, onSuccess, onError, onComplete) => {
  try {
    // Build URL and query parameters
    let fullUrl = url;
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
    
    // Get authentication token
    const token = localStorage.getItem('token');
    
    // Send request
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    });
    
    // Check response status
    if (!response.ok) {
      // Try to read error message
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.msg || `Error: ${response.status} ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Get Blob data
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 100);
    
    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    // Call error callback
    if (onError) {
      onError(error);
    }
  } finally {
    // Call complete callback
    if (onComplete) {
      onComplete();
    }
  }
}; 