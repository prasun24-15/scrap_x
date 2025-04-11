import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MaterialDetectionProps {
  onDetectionComplete: (materials: {name: string, count: number}[]) => void;
  materialTypes: any[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const MaterialDetection = ({ onDetectionComplete, materialTypes }: MaterialDetectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detectedMaterials, setDetectedMaterials] = useState<{name: string, count: number}[]>([]);
  const [inputMethod, setInputMethod] = useState('file');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE/1024/1024}MB.`);
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      
      setImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setImageUrl(e.target.value);
    setImageFile(null);
  };
  
  const toBase64 = (file: File): Promise<{ type: string, value: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        setUploadProgress(Math.floor(progress));
        if (progress >= 100) clearInterval(interval);
      }, 150);
      
      reader.onload = () => {
        clearInterval(interval);
        setUploadProgress(100);
        
        try {
          const base64Result = (reader.result as string);
          if (!base64Result) {
            throw new Error("Failed to read file content");
          }
          
          const base64Data = base64Result.split(",")[1];
          if (!base64Data) {
            throw new Error("Invalid file format");
          }
          
          resolve({
            type: "base64",
            value: base64Data
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        clearInterval(interval);
        setUploadProgress(0);
        console.error("Error reading file:", error);
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const capitalize = (word: string): string => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  // Create a data URL directly from the file - alternative to Supabase storage
  const createDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const detectMaterials = async () => {
    setError('');
    setIsLoading(true);
    setUploadProgress(0);
    setProcessedImageUrl(null);
    
    try {
      let imageData = null;
      let originalImageUrl = '';

      if (inputMethod === 'file' && imageFile) {
        try {
          // Use the local URL from the image file
          originalImageUrl = imageUrl; // This is already set in handleFileChange
          
          // Convert to base64 for the ML API
          imageData = await toBase64(imageFile);
        } catch (e) {
          console.error("Error processing file:", e);
          throw new Error("Failed to process image. Please try again.");
        }
      } else if (inputMethod === 'url' && imageUrl) {
        // Validate URL
        try {
          new URL(imageUrl); // This will throw if URL is invalid
          originalImageUrl = imageUrl;
          imageData = {
            type: "url",
            value: imageUrl
          };
        } catch (e) {
          throw new Error("Please enter a valid image URL.");
        }
      } else {
        setError("Please select a file or enter a valid image URL.");
        setIsLoading(false);
        return;
      }

      // IMPORTANT: Update the form with the ORIGINAL image URL right away
      // This ensures the listing uses the original image, not the ML-processed one
      const imageElement = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
      if (imageElement && originalImageUrl) {
        console.log("Setting image URL in form:", originalImageUrl);
        imageElement.value = originalImageUrl;
        const event = new Event('input', { bubbles: true });
        imageElement.dispatchEvent(event);
      }

      // Make the API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // Display a toast notification that detection is in progress
        toast({
          title: "Material detection in progress",
          description: "Please wait while we analyze your image...",
        });
        
        console.log("Sending image data to ML API");
        const response = await fetch("https://serverless.roboflow.com/infer/workflows/scrapx/detect-count-and-visualize-3", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            api_key: "9MZn7v3mCyEFMsYzlJbw",
            inputs: {
              image: imageData
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMsg = `API request failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // If we can't parse the error response, use the default message
          }
          throw new Error(errorMsg);
        }

        const result = await response.json();
        console.log("ML API response:", result);
        const predictions = result.outputs?.[0]?.predictions?.predictions || [];
        
        // Store the processed image URL if available - but ONLY for display in this component,
        // NOT for the actual listing
        if (result.outputs?.[0]?.visualized_image?.url) {
          const mlProcessedImageUrl = result.outputs[0].visualized_image.url;
          console.log("Got ML processed image URL for visualization only:", mlProcessedImageUrl);
          setProcessedImageUrl(mlProcessedImageUrl);
          
          // DO NOT update the form with the ML-processed image
          // We want to keep using the original image for the listing
        } else {
          // If no processed image, ensure we still use the original
          console.log("No ML processed image, using original for visualization");
          setProcessedImageUrl(imageUrl); // Use the display URL, not the data URL
        }
        
        if (predictions.length === 0) {
          toast({
            title: "No materials detected",
            description: "Try uploading a clearer image of your materials.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Count occurrences of each material class
        const materialCounts: Record<string, number> = {};
        predictions.forEach((p: any) => {
          const className = capitalize(p.class);
          materialCounts[className] = (materialCounts[className] || 0) + 1;
        });
        
        // Format the results and filter to match our material types
        const validMaterialNames = materialTypes.map(m => m.name);
        const detectedMaterialsList = Object.entries(materialCounts)
          .map(([name, count]) => ({ name, count }))
          .filter(item => validMaterialNames.includes(item.name));
        
        if (detectedMaterialsList.length === 0) {
          toast({
            title: "No matching materials",
            description: "The detected materials don't match any in our system.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        setDetectedMaterials(detectedMaterialsList);
        onDetectionComplete(detectedMaterialsList);
        
        toast({
          title: "Detection successful",
          description: `Found ${detectedMaterialsList.length} material types in your image.`,
        });
        
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error("Detection request timed out. Please try again with a simpler image.");
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
      
    } catch (error) {
      console.error("Error detecting materials:", error);
      setError(error.message || "Failed to detect materials. Please try again.");
      toast({
        title: "Detection failed",
        description: error.message || "Failed to detect materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Material Detection</CardTitle>
        <CardDescription>Upload an image to automatically detect materials</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" onValueChange={setInputMethod}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="file">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="mb-4"
              disabled={isLoading}
            />
            {imageUrl && inputMethod === 'file' && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <img src={imageUrl} alt="Preview" className="max-h-40 rounded-md border" />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <Input 
              type="text" 
              placeholder="Enter image URL" 
              value={imageUrl}
              onChange={handleUrlChange}
              className="mb-4"
              disabled={isLoading}
            />
            {imageUrl && inputMethod === 'url' && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="max-h-40 rounded-md border" 
                  onError={() => setError("Failed to load image from URL. Please check the URL is correct.")}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Processing image...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <Button 
          onClick={detectMaterials} 
          className="w-full mt-4"
          disabled={isLoading || (!imageFile && !imageUrl)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadProgress >= 100 ? "Analyzing Image..." : "Processing Image..."}
            </>
          ) : (
            "Detect Materials"
          )}
        </Button>
        
        {/* Show ML Processed Image */}
        {processedImageUrl && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Original Image:</p>
              <img 
                src={imageUrl} 
                alt="Original uploaded image" 
                className="rounded-md border w-full object-contain max-h-48"
                onError={(e) => {
                  console.error("Failed to load original image:", imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/400x300/e2e8f0/1e293b?text=Image+Load+Error";
                }}
              />
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">ML Analysis Results:</p>
              <img 
                src={processedImageUrl} 
                alt="Processed with ML detection" 
                className="rounded-md border w-full object-contain max-h-48"
                onError={(e) => {
                  console.error("Failed to load processed image:", processedImageUrl);
                  const target = e.target as HTMLImageElement;
                  target.src = imageUrl || "https://placehold.co/400x300/e2e8f0/1e293b?text=Processing+Error";
                }}
              />
              <p className="text-xs text-gray-500 mt-1 italic">
                This ML analysis image is for visualization only. Your original image will be used for the listing.
              </p>
            </div>
          </div>
        )}
        
        {detectedMaterials.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium mb-2">Detected Materials:</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {detectedMaterials.map((material, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {material.name} {material.count > 1 && `(${material.count})`}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Scroll down to adjust quantities and prices for each material.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialDetection; 