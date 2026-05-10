/**
 * Color utility functions for converting RGB values to human-readable color names
 * Based on w3color.js by w3schools.com
 */

// Standard CSS color names with their corresponding hex values
const COLOR_NAMES = [
  "AliceBlue",
  "AntiqueWhite",
  "Aqua",
  "Aquamarine",
  "Azure",
  "Beige",
  "Bisque",
  "Black",
  "BlanchedAlmond",
  "Blue",
  "BlueViolet",
  "Brown",
  "BurlyWood",
  "CadetBlue",
  "Chartreuse",
  "Chocolate",
  "Coral",
  "CornflowerBlue",
  "Cornsilk",
  "Crimson",
  "Cyan",
  "DarkBlue",
  "DarkCyan",
  "DarkGoldenRod",
  "DarkGray",
  "DarkGrey",
  "DarkGreen",
  "DarkKhaki",
  "DarkMagenta",
  "DarkOliveGreen",
  "DarkOrange",
  "DarkOrchid",
  "DarkRed",
  "DarkSalmon",
  "DarkSeaGreen",
  "DarkSlateBlue",
  "DarkSlateGray",
  "DarkSlateGrey",
  "DarkTurquoise",
  "DarkViolet",
  "DeepPink",
  "DeepSkyBlue",
  "DimGray",
  "DimGrey",
  "DodgerBlue",
  "FireBrick",
  "FloralWhite",
  "ForestGreen",
  "Fuchsia",
  "Gainsboro",
  "GhostWhite",
  "Gold",
  "GoldenRod",
  "Gray",
  "Grey",
  "Green",
  "GreenYellow",
  "HoneyDew",
  "HotPink",
  "IndianRed",
  "Indigo",
  "Ivory",
  "Khaki",
  "Lavender",
  "LavenderBlush",
  "LawnGreen",
  "LemonChiffon",
  "LightBlue",
  "LightCoral",
  "LightCyan",
  "LightGoldenRodYellow",
  "LightGray",
  "LightGrey",
  "LightGreen",
  "LightPink",
  "LightSalmon",
  "LightSeaGreen",
  "LightSkyBlue",
  "LightSlateGray",
  "LightSlateGrey",
  "LightSteelBlue",
  "LightYellow",
  "Lime",
  "LimeGreen",
  "Linen",
  "Magenta",
  "Maroon",
  "MediumAquaMarine",
  "MediumBlue",
  "MediumOrchid",
  "MediumPurple",
  "MediumSeaGreen",
  "MediumSlateBlue",
  "MediumSpringGreen",
  "MediumTurquoise",
  "MediumVioletRed",
  "MidnightBlue",
  "MintCream",
  "MistyRose",
  "Moccasin",
  "NavajoWhite",
  "Navy",
  "OldLace",
  "Olive",
  "OliveDrab",
  "Orange",
  "OrangeRed",
  "Orchid",
  "PaleGoldenRod",
  "PaleGreen",
  "PaleTurquoise",
  "PaleVioletRed",
  "PapayaWhip",
  "PeachPuff",
  "Peru",
  "Pink",
  "Plum",
  "PowderBlue",
  "Purple",
  "RebeccaPurple",
  "Red",
  "RosyBrown",
  "RoyalBlue",
  "SaddleBrown",
  "Salmon",
  "SandyBrown",
  "SeaGreen",
  "SeaShell",
  "Sienna",
  "Silver",
  "SkyBlue",
  "SlateBlue",
  "SlateGray",
  "SlateGrey",
  "Snow",
  "SpringGreen",
  "SteelBlue",
  "Tan",
  "Teal",
  "Thistle",
  "Tomato",
  "Turquoise",
  "Violet",
  "Wheat",
  "White",
  "WhiteSmoke",
  "Yellow",
  "YellowGreen",
];

const COLOR_HEXS = [
  "f0f8ff",
  "faebd7",
  "00ffff",
  "7fffd4",
  "f0ffff",
  "f5f5dc",
  "ffe4c4",
  "000000",
  "ffebcd",
  "0000ff",
  "8a2be2",
  "a52a2a",
  "deb887",
  "5f9ea0",
  "7fff00",
  "d2691e",
  "ff7f50",
  "6495ed",
  "fff8dc",
  "dc143c",
  "00ffff",
  "00008b",
  "008b8b",
  "b8860b",
  "a9a9a9",
  "a9a9a9",
  "006400",
  "bdb76b",
  "8b008b",
  "556b2f",
  "ff8c00",
  "9932cc",
  "8b0000",
  "e9967a",
  "8fbc8f",
  "483d8b",
  "2f4f4f",
  "2f4f4f",
  "00ced1",
  "9400d3",
  "ff1493",
  "00bfff",
  "696969",
  "696969",
  "1e90ff",
  "b22222",
  "fffaf0",
  "228b22",
  "ff00ff",
  "dcdcdc",
  "f8f8ff",
  "ffd700",
  "daa520",
  "808080",
  "808080",
  "008000",
  "adff2f",
  "f0fff0",
  "ff69b4",
  "cd5c5c",
  "4b0082",
  "fffff0",
  "f0e68c",
  "e6e6fa",
  "fff0f5",
  "7cfc00",
  "fffacd",
  "add8e6",
  "f08080",
  "e0ffff",
  "fafad2",
  "d3d3d3",
  "d3d3d3",
  "90ee90",
  "ffb6c1",
  "ffa07a",
  "20b2aa",
  "87cefa",
  "778899",
  "778899",
  "b0c4de",
  "ffffe0",
  "00ff00",
  "32cd32",
  "faf0e6",
  "ff00ff",
  "800000",
  "66cdaa",
  "0000cd",
  "ba55d3",
  "9370db",
  "3cb371",
  "7b68ee",
  "00fa9a",
  "48d1cc",
  "c71585",
  "191970",
  "f5fffa",
  "ffe4e1",
  "ffe4b5",
  "ffdead",
  "000080",
  "fdf5e6",
  "808000",
  "6b8e23",
  "ffa500",
  "ff4500",
  "da70d6",
  "eee8aa",
  "98fb98",
  "afeeee",
  "db7093",
  "ffefd5",
  "ffdab9",
  "cd853f",
  "ffc0cb",
  "dda0dd",
  "b0e0e6",
  "800080",
  "663399",
  "ff0000",
  "bc8f8f",
  "4169e1",
  "8b4513",
  "fa8072",
  "f4a460",
  "2e8b57",
  "fff5ee",
  "a0522d",
  "c0c0c0",
  "87ceeb",
  "6a5acd",
  "708090",
  "708090",
  "fffafa",
  "00ff7f",
  "4682b4",
  "d2b48c",
  "008080",
  "d8bfd8",
  "ff6347",
  "40e0d0",
  "ee82ee",
  "f5deb3",
  "ffffff",
  "f5f5f5",
  "ffff00",
  "9acd32",
];

/**
 * Interface for RGB color values
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts RGB values to a human-readable color name
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns The name of the closest matching color, or empty string if no match
 */
export function rgbToColorName(r: number, g: number, b: number): string {
  // Clamp values to valid range
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // Try to find exact match first
  for (let i = 0; i < COLOR_HEXS.length; i++) {
    const hexR = parseInt(COLOR_HEXS[i].substring(0, 2), 16);
    const hexG = parseInt(COLOR_HEXS[i].substring(2, 4), 16);
    const hexB = parseInt(COLOR_HEXS[i].substring(4, 6), 16);

    if (r === hexR && g === hexG && b === hexB) {
      return COLOR_NAMES[i];
    }
  }

  // If no exact match, find closest color
  return findClosestColorName(r, g, b);
}

/**
 * Converts an RGB color object to a human-readable color name
 * @param rgb - Object with r, g, b properties
 * @returns The name of the closest matching color
 */
export function rgbObjectToColorName(rgb: RGBColor): string {
  return rgbToColorName(rgb.r, rgb.g, rgb.b);
}

/**
 * Converts a hex color string to a human-readable color name
 * @param hex - Hex color string (with or without #)
 * @returns The name of the closest matching color
 */
export function hexToColorName(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "").toLowerCase();

  // Expand shorthand hex to full hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return rgbToColorName(r, g, b);
}

/**
 * Finds the closest color name by calculating the Euclidean distance
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns The name of the closest matching color
 */
function findClosestColorName(r: number, g: number, b: number): string {
  let closestDistance = Infinity;
  let closestColorIndex = 0;

  for (let i = 0; i < COLOR_HEXS.length; i++) {
    const hexR = parseInt(COLOR_HEXS[i].substring(0, 2), 16);
    const hexG = parseInt(COLOR_HEXS[i].substring(2, 4), 16);
    const hexB = parseInt(COLOR_HEXS[i].substring(4, 6), 16);

    // Calculate Euclidean distance
    const distance = Math.sqrt(
      Math.pow(r - hexR, 2) + Math.pow(g - hexG, 2) + Math.pow(b - hexB, 2),
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColorIndex = i;
    }
  }

  return COLOR_NAMES[closestColorIndex];
}

/**
 * Gets a list of all available color names
 * @returns Array of all color names
 */
export function getAvailableColorNames(): string[] {
  return [...COLOR_NAMES];
}

/**
 * Gets the hex value for a color name
 * @param colorName - The name of the color
 * @returns The hex value (without #), or empty string if not found
 */
export function colorNameToHex(colorName: string): string {
  const index = COLOR_NAMES.findIndex(
    (name) => name.toLowerCase() === colorName.toLowerCase(),
  );
  return index !== -1 ? COLOR_HEXS[index] : "";
}

/**
 * Gets the RGB values for a color name
 * @param colorName - The name of the color
 * @returns Object with r, g, b properties, or null if not found
 */
export function colorNameToRgb(colorName: string): RGBColor | null {
  const hex = colorNameToHex(colorName);
  if (!hex) return null;

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Converts hex color string to RGB object
 * @param hex - Hex color string (with or without #)
 * @returns Object with r, g, b properties
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # if present
  hex = hex.replace("#", "").toLowerCase();

  // Expand shorthand hex to full hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Converts RGB values to hex color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string with # prefix (e.g., #FF0000)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts RGB object to hex color string
 * @param rgb - Object with r, g, b properties
 * @returns Hex color string with # prefix
 */
export function rgbObjectToHex(rgb: RGBColor): string {
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}
