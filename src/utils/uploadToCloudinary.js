const cloud_name = "dz5snxfyz";
const upload_preset = "bharatjangirsocialapp";

export async function uploadToCloudinary(file, fileType) {
  if (!file || !fileType) {
    console.error("Upload failed: Missing file or fileType");
    return null;
  }

  try {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", cloud_name);

    console.log("Uploading to Cloudinary:", {
      fileName: file.name,
      fileType: fileType,
      fileSize: file.size,
      cloudName: cloud_name,
      uploadPreset: upload_preset
    });

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/${fileType}/upload`,
      { method: "POST", body: data }
    );
    
    console.log("Cloudinary response status:", res.status);
    
    if (!res.ok) {
      throw new Error(`Upload failed with status: ${res.status}`);
    }
    
    const fileData = await res.json();
    console.log("Cloudinary response data:", fileData);
    
    if (fileData.error) {
      throw new Error(`Cloudinary error: ${fileData.error.message}`);
    }
    
    if (!fileData.url) {
      throw new Error("No URL returned from Cloudinary");
    }
    
    return fileData.url;
  } catch (error) {
    console.error("Upload to Cloudinary failed:", error);
    return null;
  }
}
