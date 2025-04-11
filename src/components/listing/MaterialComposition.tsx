import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface MaterialItem {
  name: string;
  count: number;
  materialTypeId?: string;
  quantity?: number;
  basePrice?: number;
}

interface MaterialCompositionProps {
  materials: MaterialItem[];
  materialTypes: any[];
  onQuantityChange: (materialItems: MaterialItem[]) => void;
}

const MaterialComposition = ({ materials, materialTypes, onQuantityChange }: MaterialCompositionProps) => {
  const [enrichedMaterials, setEnrichedMaterials] = useState<MaterialItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
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
        quantity: 1 // Default quantity of 1 kg
      };
    });
    
    setEnrichedMaterials(enriched);
    onQuantityChange(enriched);
  }, [materials, materialTypes]);
  
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
          
          return (
            <div key={index} className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <Label className="font-medium">
                  {material.name} {material.count > 1 && `(${material.count})`}
                </Label>
                <span className="text-sm text-gray-500">{percentage}%</span>
              </div>
              
              <Progress value={percentage} className="h-2 mb-2" />
              
              <div className="grid grid-cols-2 gap-4 mt-3">
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
                  <Label className="text-sm">Base Price</Label>
                  <div className="mt-1 py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    ₹ {material.basePrice || 'N/A'}/kg
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MaterialComposition; 