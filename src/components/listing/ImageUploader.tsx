import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  initialImage?: string | null;
  onImageSelected: (imageUrl: string) => void;
}

// Add a default fallback image for listings that don't have images
export const DEFAULT_SCRAP_IMAGE = "https://res.cloudinary.com/ddm7aksef/image/upload/v1744382728/WhatsApp_Image_2025-04-11_at_19.27.03_419fe003_dwgak4.jpg";

const ImageUploader = ({ initialImage, onImageSelected }: ImageUploaderProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    disabled: uploading,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      handleImageUpload(acceptedFiles[0]);
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error) {
        if (error.code === 'file-too-large') {
          toast({
            title: "File too large",
            description: "The image must be less than 5MB",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid file",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }
  });

  // Direct upload to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = "ddm7aksef";
    const uploadPreset = "ml_default";
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Cloudinary upload successful:", data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);
      
      // Create a local URL for the image
      const localImageUrl = URL.createObjectURL(file);
      
      // Update state with the local image URL
      setUploadedImage(localImageUrl);
      onImageSelected(localImageUrl);
      
      toast({
        title: "Image selected",
        description: "Your image has been successfully added",
      });
      
    } catch (error) {
      console.error("Error handling image:", error);
      setUploadError("Failed to process image. Please try again.");
      toast({
        title: "Upload Failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadError(null);
    onImageSelected("");
  };

  useEffect(() => {
    // If initialImage changes and is valid, update the component
    if (initialImage && initialImage !== uploadedImage) {
      console.log("Updating image from initialImage prop:", initialImage);
      setUploadedImage(initialImage);
    }
  }, [initialImage]);

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="bg-red-50 p-2 rounded-md text-red-600 text-sm">
          {uploadError}
        </div>
      )}
      <div 
        className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
          uploading ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-teal-500 hover:bg-teal-50'
        } ${uploadedImage ? 'p-2' : 'p-6'}`}
      >
        {uploadedImage ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <img
              src={uploadedImage}
              alt="Material preview"
              className="max-h-64 mx-auto rounded-md object-contain"
              onError={(e) => {
                console.error("Failed to load image:", uploadedImage);
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/400x300/e2e8f0/1e293b?text=Image+Load+Error";
              }}
            />
            <div className="absolute top-0 right-0 p-1">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6 rounded-full"
                onClick={removeImage}
              >
                <X size={14} />
              </Button>
            </div>
          </motion.div>
        ) : (
          <div
            key="dropzone"
            className="text-center"
          >
            <div {...getRootProps()} className="flex flex-col items-center justify-center py-4">
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 className="h-10 w-10 text-teal-500 animate-spin mb-2" />
              ) : (
                <ImageIcon className="h-10 w-10 text-teal-500 mb-2" />
              )}
              <p className="text-lg font-semibold">
                {uploading ? "Uploading..." : "Drop image here or click to upload"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG or GIF (max 5MB)
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                disabled={uploading}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
