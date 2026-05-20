import cloudinary from "./cloudinary.js";

/**
 * Uploads a file buffer to Cloudinary using upload stream.
 * @param {Buffer} buffer The file buffer from multer memory storage
 * @returns {Promise<object>} The Cloudinary upload result
 */
export const uploadToCloudinary = (buffer) => {
  console.log("Upload to Cloudinary called");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "stock_market_simulator_profiles" },
      (err, result) => {
        if (err) {
          console.error("Cloudinary upload stream error:", err);
          return reject(err);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary using its public ID extracted from the secure URL.
 * @param {string} imageUrl The full secure URL of the image on Cloudinary
 * @returns {Promise<object|null>} The Cloudinary destroy result or null
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    
    // Cloudinary URLs look like:
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<filename>.<ext>
    const parts = imageUrl.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let pathParts = parts.slice(uploadIndex + 1);
    // If the next part is version (e.g. v12345678), remove it
    if (pathParts[0] && pathParts[0].match(/^v\d+/)) {
      pathParts = pathParts.slice(1);
    }
    
    const publicIdWithExt = pathParts.join("/");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    const publicId = dotIndex === -1 ? publicIdWithExt : publicIdWithExt.substring(0, dotIndex);

    console.log("Extracted public ID for deletion:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary destroy result:", result);
    return result;
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err);
    return null;
  }
};
