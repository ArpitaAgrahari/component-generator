module.exports = {
  plugins: {
    // Call the required plugin functions
    tailwindcss: require('tailwindcss')(), // Call tailwindcss plugin function
    autoprefixer: require('autoprefixer')(), // Call autoprefixer plugin function
  },
};
