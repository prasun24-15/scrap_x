import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface MaterialDetectionProps {
  onDetectionComplete: (materials: {name: string, count: number}[]) => void;
  materialTypes: any[];
}

const MaterialDetection = ({ onDetectionComplete, materialTypes }: MaterialDetectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detectedMaterials, setDetectedMaterials] = useState<{name: string, count: number}[]>([]);
  const [inputMethod, setInputMethod] = useState('file');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setImageUrl(previewUrl);
      setError('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null);
    setError('');
  };
  
  const toBase64 = (file: File): Promise<{ type: string, value: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        type: "base64",
        value: (reader.result as string).split(",")[1]
      });
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const capitalize = (word: string): string => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const detectMaterials = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      let imageData = null;

      if (inputMethod === 'file' && imageFile) {
        imageData = await toBase64(imageFile);
      } else if (inputMethod === 'url' && imageUrl) {
        imageData = {
          type: "url",
          value: imageUrl
        };
      } else {
        setError("Please select a file or enter a valid image URL.");
        setIsLoading(false);
        return;
      }

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
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const predictions = result.outputs?.[0]?.predictions?.predictions || [];
      
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
      
      setDetectedMaterials(detectedMaterialsList);
      onDetectionComplete(detectedMaterialsList);
      
    } catch (error) {
      console.error("Error detecting materials:", error);
      setError("Failed to detect materials. Please try again.");
    } finally {
      setIsLoading(false);
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
            />
            {imageUrl && inputMethod === 'file' && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <img src={imageUrl} alt="Preview" className="max-h-40 rounded-md" />
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
            />
            {imageUrl && inputMethod === 'url' && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <img src={imageUrl} alt="Preview" className="max-h-40 rounded-md" />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {error && (
          <p className="text-red-500 text-sm mt-2 mb-4">{error}</p>
        )}
        
        <Button 
          onClick={detectMaterials} 
          className="w-full mt-4"
          disabled={isLoading || (!imageFile && !imageUrl)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting Materials...
            </>
          ) : (
            "Detect Materials"
          )}
        </Button>
        
        {detectedMaterials.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Detected Materials:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {detectedMaterials.map((material, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  {material.name} {material.count > 1 && `(${material.count})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialDetection; 