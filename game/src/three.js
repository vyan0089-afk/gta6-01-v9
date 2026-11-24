// ARUNIKA: Golden Hour — three.js
// three.min.js (r152, vendored) loads as a classic script in index.html
// before any module runs, so window.THREE is set. Re-export it for the
// game's ES modules.
export const THREE = window.THREE;
