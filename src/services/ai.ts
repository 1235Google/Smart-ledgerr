export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const sendChatMessage = async (
  message: string,
  userData: any,
  chatHistory: any[],
  signal?: AbortSignal
) => {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userData,
        chatHistory,
      }),
      signal
    });

    if (!res.ok) {
      let errorMessage = 'Failed to get response from server';
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) {
        // Ignore if not JSON
      }
      throw new ApiError(errorMessage, res.status);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out.', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error');
  }
};
