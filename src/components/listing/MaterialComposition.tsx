import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialItem } from '@/types';

interface MaterialCompositionProps {
  materials: MaterialItem[];
  materialTypes: any[];
  onQuantityChange: (materialItems: MaterialItem[]) => void;
}

const MaterialComposition = ({ materials, materialTypes, onQuantityChange }: MaterialCompositionProps) => {
  const [enrichedMaterials, setEnrichedMaterials] = useState<MaterialItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialTypeId, setNewMaterialTypeId] = useState('');
  
  useEffect(() => {
    if (!materials.length) return;
    
    // Calculate total count
    const total = materials.reduce((sum, material) => sum + material.count, 0);
    setTotalCount(total);
    
    // Enrich with material type info from database
    const enriched = materials.map(material => {
      const materialType = materialTypes.find(mt => mt.name === material.name);
      return {
        ...material,
        materialTypeId: materialType?.id,
        basePrice: materialType?.base_price,
        quantity: 1, // Default quantity of 1 kg
        customPrice: materialType?.base_price // Initialize custom price with base price
      };
    });
    
    setEnrichedMaterials(enriched);
    onQuantityChange(enriched);
  }, [materials, materialTypes]);

  useEffect(() => {
    // Calculate total price using the same weighted average logic
    let totalWeight = 0;
    let weightedSum = 0;
    
    enrichedMaterials.forEach(material => {
      const weight = Number(material.quantity) || 0;
      const price = material.customPrice !== undefined 
        ? Number(material.customPrice) 
        : Number(material.basePrice) || 0;
      
      totalWeight += weight;
      weightedSum += weight * price;
    });
    
    // If we have materials with weights, use weighted average, otherwise sum
    const finalPrice = totalWeight > 0 
      ? weightedSum 
      : enrichedMaterials.reduce((sum, material) => {
          const priceToUse = material.customPrice !== undefined ? material.customPrice : material.basePrice || 0;
          return sum + (priceToUse * (material.quantity || 0));
        }, 0);
    
    setTotalPrice(finalPrice);
  }, [enrichedMaterials]);
  
  const handleQuantityChange = (index: number, value: string) => {
    const newQuantity = parseFloat(value) || 0;
    
    const updatedMaterials = enrichedMaterials.map((material, idx) => {
      if (idx === index) {
        return { ...material, quantity: newQuantity };
      }
      return material;
    });
    
    setEnrichedMaterials(updatedMaterials);
    onQuantityChange(updatedMaterials);
  };

  const handlePriceChange = (index: number, value: string) => {
    const newPrice = parseFloat(value) || 0;
    
    const updatedMaterials = enrichedMaterials.map((material, idx) => {
      if (idx === index) {
        return { ...material, customPrice: newPrice };
      }
      return material;
    });
    
    setEnrichedMaterials(updatedMaterials);
    onQuantityChange(updatedMaterials);
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...enrichedMaterials];
    updatedMaterials.splice(index, 1);
    setEnrichedMaterials(updatedMaterials);
    onQuantityChange(updatedMaterials);
  };

  const handleAddMaterial = () => {
    if (!newMaterialTypeId) return;
    
    const materialType = materialTypes.find(mt => mt.id === newMaterialTypeId);
    if (!materialType) return;
    
    const newMaterial = {
      name: materialType.name,
      count: 1,
      materialTypeId: materialType.id,
      basePrice: materialType.base_price,
      quantity: 1,
      customPrice: materialType.base_price
    };
    
    const updatedMaterials = [...enrichedMaterials, newMaterial];
    setEnrichedMaterials(updatedMaterials);
    onQuantityChange(updatedMaterials);
    setShowAddMaterial(false);
    setNewMaterialTypeId('');
  };
  
  if (!enrichedMaterials.length) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Composition</CardTitle>
        <CardDescription>
          The detected materials and their composition percentages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enrichedMaterials.map((material, index) => {
          const percentage = Math.round((material.count / totalCount) * 100);
          const subtotal = (material.customPrice !== undefined ? material.customPrice : material.basePrice || 0) * (material.quantity || 0);
          
          return (
            <div key={index} className="mb-6 bg-gray-50 p-4 rounded-md relative">
              {enrichedMaterials.length > 1 && (
                <button 
                  onClick={() => handleRemoveMaterial(index)} 
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <div className="flex justify-between items-center mb-1">
                <Label className="font-medium">
                  {material.name} {material.count > 1 && `(${material.count})`}
                </Label>
                <span className="text-sm text-gray-500">{percentage}%</span>
              </div>
              
              <Progress value={percentage} className="h-2 mb-4" />
              
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Label htmlFor={`quantity-${index}`} className="text-sm">
                    Quantity (kg)
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={material.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Base Price (₹)</Label>
                  <div className="mt-1 py-2 px-3 bg-white rounded-md border border-gray-200 text-gray-700">
                    {material.basePrice || 'N/A'}/kg
                  </div>
                </div>

                <div>
                  <Label htmlFor={`price-${index}`} className="text-sm">
                    Custom Price (₹)
                  </Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={material.customPrice}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mt-3 text-right text-sm font-medium">
                Subtotal: ₹{subtotal.toFixed(2)}
              </div>
            </div>
          );
        })}
        
        {showAddMaterial ? (
          <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
            <Label className="mb-2 block">Add Material</Label>
            <div className="flex gap-2">
              <Select value={newMaterialTypeId} onValueChange={setNewMaterialTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes
                    .filter(type => !enrichedMaterials.some(m => m.materialTypeId === type.id))
                    .map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button 
                type="button"
                onClick={handleAddMaterial}
                disabled={!newMaterialTypeId}
              >
                Add
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddMaterial(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowAddMaterial(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 flex justify-between border-t">
        <div className="font-medium">Total Price:</div>
        <div className="font-bold text-lg">₹{totalPrice.toFixed(2)}</div>
      </CardFooter>
    </Card>
  );
};

export default MaterialComposition;

// Add this function to calculate the average price per kg
export const calculateCombinedPrice = (materials: MaterialItem[]): number => {
  if (!materials || materials.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;

  materials.forEach(material => {
    const weight = Number(material.quantity) || 0;
    // Use customPrice if available, otherwise fall back to basePrice
    const price = material.customPrice !== undefined 
      ? Number(material.customPrice) 
      : Number(material.basePrice) || 0;
    
    totalWeight += weight;
    weightedSum += weight * price;
  });

  // Return the weighted average (total price divided by total weight)
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

// Add this component to display the combined price
export const CombinedPriceDisplay: React.FC<{ materials: MaterialItem[] }> = ({ materials }) => {
  const combinedPrice = calculateCombinedPrice(materials);
  
  return (
    <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
      <h3 className="text-sm font-medium text-green-800">Combined Price:</h3>
      <p className="text-xl font-bold text-green-700">₹{combinedPrice.toFixed(2)}/kg</p>
      <p className="text-xs text-green-600 mt-1">
        (Weighted average price based on quantity of each material)
      </p>
    </div>
  );
}; 