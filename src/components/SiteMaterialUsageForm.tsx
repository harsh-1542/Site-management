import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Minus, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  name: string;
  unit: string;
  rate_per_unit: number;
  stock_quantity: number;
}

interface MaterialItem {
  productId: string;
  quantity: number;
  unit: string;
  ratePerUnit: number;
}

interface SiteMaterialUsageFormProps {
  siteId: string;
  siteName: string;
  onSuccess?: () => void;
}

export default function SiteMaterialUsageForm({ siteId, siteName, onSuccess }: SiteMaterialUsageFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<MaterialItem[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 0, unit: '', ratePerUnit: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const validateQuantity = (quantity: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { isValid: false, message: 'Product not found' };
    
    if (quantity <= 0) {
      return { isValid: false, message: 'Quantity must be greater than 0' };
    }
    
    if (quantity > product.stock_quantity) {
      return { 
        isValid: false, 
        message: `Only ${product.stock_quantity} ${product.unit} available in stock` 
      };
    }
    
    return { isValid: true, message: '' };
  };

  const updateItem = (index: number, field: keyof MaterialItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          unit: product.unit,
          ratePerUnit: product.rate_per_unit,
          quantity: 0 // Reset quantity when product changes
        };
      }
    } else if (field === 'quantity') {
      const quantity = typeof value === 'string' ? parseFloat(value) || 0 : value;
      const validation = validateQuantity(quantity, newItems[index].productId);
      
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
      
      newItems[index] = {
        ...newItems[index],
        [field]: quantity
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
    }
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one material');
      return;
    }

    // Validate all items
    const invalidItems = items.filter(item => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error('Please fill in all material details correctly');
      return;
    }

    setSubmitting(true);

    try {
      // Record material usage and update inventory in a single transaction
      const { error: usageError } = await supabase
        .from('site_material_usage')
        .insert(
          items.map(item => ({
            site_id: siteId,
            product_id: item.productId,
            quantity_used: item.quantity,
            usage_date: new Date().toISOString()
          }))
        );

      if (usageError) throw usageError;

      // Update inventory quantities
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        const newQuantity = product.stock_quantity - item.quantity;
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const { error: updateError } = await supabase
          .from('inventory_products')
          .update({ stock_quantity: newQuantity })
          .eq('id', item.productId);

        if (updateError) throw updateError;
      }

      toast.success('Material usage recorded successfully');
      setItems([]);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error recording material usage:', error);
      toast.error(error.message || 'Failed to record material usage');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    return items.reduce((total, item) => total + (item.quantity * item.ratePerUnit), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Material Usage - {siteName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Record Material Usage</h3>
            <Button onClick={addItem} size="sm" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>

          {items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const validation = product ? validateQuantity(item.quantity, item.productId) : { isValid: true, message: '' };
            
            return (
              <div key={index} className="grid gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Material {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateItem(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.stock_quantity} {product.unit} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={!validation.isValid ? 'border-red-500' : ''}
                      />
                      <div className="flex items-center px-3 bg-gray-100 rounded-md">
                        {item.unit}
                      </div>
                    </div>
                    {!validation.isValid && (
                      <Alert variant="destructive" className="py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{validation.message}</AlertDescription>
                      </Alert>
                    )}
                    {product && (
                      <div className="text-sm text-gray-500">
                        Available: {product.stock_quantity} {product.unit}
                      </div>
                    )}
                  </div>

                  {item.productId && (
                    <div className="grid gap-2">
                      <Label>Cost Summary</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between text-sm">
                          <span>Rate per {item.unit}:</span>
                          <span>₹{item.ratePerUnit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Cost:</span>
                          <span>₹{(item.quantity * item.ratePerUnit).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {items.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-lg font-bold">₹{calculateTotalCost().toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0 || items.some(item => !validateQuantity(item.quantity, item.productId).isValid)}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording Usage...
              </>
            ) : (
              'Record Material Usage'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 