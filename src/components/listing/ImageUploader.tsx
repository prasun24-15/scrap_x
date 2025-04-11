
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  initialImage?: string | null;
  onImageSelected: (imageUrl: string) => void;
}

const ImageUploader = ({ initialImage, onImageSelected }: ImageUploaderProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [uploading, setUploading] = useState(false);

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

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // In a real app, you would upload to Supabase storage
      // For now, we'll create a data URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);
        onImageSelected(dataUrl);
        
        toast({
          title: "Image uploaded",
          description: "Your image has been successfully uploaded",
        });
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    onImageSelected("");
  };

  return (
    <div className="space-y-4">
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
            {/* Fix: Separate the dropzone props from the motion div */}
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
