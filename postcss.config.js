// postcss.config.js
//
// Next.js looks for this file at the project root and runs every imported
// CSS file through these plugins. Without it, the @tailwind directives in
// app/globals.css ship as raw text to the browser and nothing gets styled.

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
