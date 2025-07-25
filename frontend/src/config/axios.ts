import axios from 'axios';

// Define the base URL for your API.
// It tries to use an environment variable (NEXT_PUBLIC_API_BASE_URL)
// first, which is ideal for different environments (development, production).
// If the environment variable is not set, it defaults to http://localhost:5000/api.
// IMPORTANT: Ensure 'http://localhost:5000' matches the port your backend server is listening on.
// The '/api' suffix is common if all your backend routes are prefixed with /api.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Create a custom Axios instance.
// This is generally better practice than modifying the global axios.defaults,
// as it allows you to have different configurations for different types of requests
// if your application grows.
const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle errors more gracefully.
// This will log more details about the error, which can be helpful for debugging
// whether it's a network issue or a server-side error (e.g., 400, 500 status codes).
instance.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  (error) => {
    // Log the full error object for debugging
    console.error('Axios Interceptor Error:', error);

    // You can add specific handling here based on error status codes
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error('Request made but no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }

    // Re-throw the error so it can be caught by the calling function (e.g., in handleSubmit)
    return Promise.reject(error);
  }
);

export default instance;
