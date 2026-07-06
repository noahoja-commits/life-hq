const fs = require("fs");
let css = fs.readFileSync("src/index.css", "utf8");

// Remove the noise grain body::after block
css = css.replace(
  /\/\* Noise grain overlay[\s\S]*?body::after\s*\{[\s\S]*?background-image: url\("data:image\/svg\+xml[\s\S]*?<\/svg>"\);\s*\}/m,
  ""
);

// Remove the scanlines body::before block
css = css.replace(
  /\/\* Scanlines[\s\S]*?body::before\s*\{[\s\S]*?rgba\(0,0,0,0\.3\) 3px\s*\);\s*\}/m,
  ""
);

// Remove the global vignette body::before block (only if it still exists)
css = css.replace(
  /\/\* Global vignette[\s\S]*?body::before\s*\{[\s\S]*?radial-gradient[\s\S]*?\}[\s\S]*?\}/m,
  ""
);

fs.writeFileSync("src/index.css", css, "utf8");
console.log("Removed noise grain, scanlines, and vignette");
