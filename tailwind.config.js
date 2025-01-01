module.exports = {
  content: [
    "./*.html", // Include all HTML files in the project root
    "./**/*.html", // Include all HTML files in subdirectories
    "./scripts.js", // Include your JS file where you use Tailwind classes
    "./**/*.js", // Include all JS files in subdirectories
    "!./node_modules/**/*", // Exclude node_modules
  ],
  theme: {
    extend: {
      filter: {
       "blue-sepia": "invert(0.8) sepia(1) hue-rotate(200deg)",
      },
      backdropFilter: {
        none: "none",
        "sepia-50": "sepia(0.5)",
        invert: "invert(1)",
        opacity: "opacity(0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-filters")],
};
