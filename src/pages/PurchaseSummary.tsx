import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Site {
  id: string;
  name: string;
}

interface MaterialUsage {
  id: string;
  site_id: string;
  product_id: string;
  quantity_used: number;
  usage_date: string;
  notes: string | null;
  product: {
    name: string;
    unit: string;
    rate_per_unit: number;
  };
  site: {
    name: string;
  };
}

interface PurchaseData {
  siteId: string;
  siteName: string;
  purchases: {
    productName: string;
    quantity: number;
    ratePerUnit: number;
    totalCost: number;
    unit: string;
  }[];
  totalSiteCost: number;
}

export default function PurchaseSummary() {
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);

  useEffect(() => {
    fetchSites();
    fetchMaterialUsage();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to load sites');
    }
  };

  const fetchMaterialUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('site_material_usage')
        .select(`
          *,
          product:inventory_products (
            name,
            unit,
            rate_per_unit
          ),
          site:sites (
            name
          )
        `)
        .order('usage_date', { ascending: false });

      if (error) throw error;

      // Transform the data into the required format
      const transformedData = transformMaterialUsageData(data || []);
      setPurchaseData(transformedData);
    } catch (error) {
      console.error('Error fetching material usage:', error);
      toast.error('Failed to load material usage data');
    } finally {
      setLoading(false);
    }
  };

  const transformMaterialUsageData = (data: MaterialUsage[]): PurchaseData[] => {
    // Group by site
    const siteGroups = data.reduce((acc, usage) => {
      const siteId = usage.site_id;
      if (!acc[siteId]) {
        acc[siteId] = {
          siteId,
          siteName: usage.site.name,
          purchases: [],
          totalSiteCost: 0
        };
      }

      // Add the purchase
      acc[siteId].purchases.push({
        productName: usage.product.name,
        quantity: usage.quantity_used,
        ratePerUnit: usage.product.rate_per_unit,
        totalCost: usage.quantity_used * usage.product.rate_per_unit,
        unit: usage.product.unit
      });

      // Update total site cost
      acc[siteId].totalSiteCost += usage.quantity_used * usage.product.rate_per_unit;

      return acc;
    }, {} as Record<string, PurchaseData>);

    return Object.values(siteGroups);
  };

  const filteredData = selectedSite === 'all' 
    ? purchaseData 
    : purchaseData.filter(site => site.siteId === selectedSite);

  const grandTotal = purchaseData.reduce((total, site) => total + site.totalSiteCost, 0);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const data = selectedSite === 'all' ? purchaseData : purchaseData.filter(site => site.siteId === selectedSite);
      
      if (format === 'pdf') {
        exportToPDF(data);
      } else {
        exportToExcel(data);
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      toast.error(`Failed to export to ${format.toUpperCase()}`);
    }
  };

  const exportToPDF = (data: PurchaseData[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Purchase Summary Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add site filter info
    if (selectedSite !== 'all') {
      const siteName = sites.find(s => s.id === selectedSite)?.name;
      doc.text(`Site: ${siteName}`, pageWidth / 2, 40, { align: 'center' });
    }

    let yOffset = 50;

    // Add each site's data
    data.forEach((site, index) => {
      // Add site header
      doc.setFontSize(14);
      doc.text(site.siteName, 14, yOffset);
      yOffset += 10;

      // Add site summary
      doc.setFontSize(12);
      doc.text(`Total Cost: ₹${site.totalSiteCost.toLocaleString()}`, 14, yOffset);
      yOffset += 10;

      // Add products table
      const tableData = site.purchases.map(purchase => [
        purchase.productName,
        `${purchase.quantity} ${purchase.unit}`,
        `₹${purchase.ratePerUnit.toLocaleString()}`,
        `₹${purchase.totalCost.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: yOffset,
        head: [['Product', 'Quantity', 'Rate/Unit', 'Total Cost']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 10 }
      });

      yOffset = (doc as any).lastAutoTable.finalY + 20;

      // Add page break if not the last site
      if (index < data.length - 1) {
        doc.addPage();
        yOffset = 20;
      }
    });

    // Add grand total if showing all sites
    if (selectedSite === 'all') {
      const grandTotal = data.reduce((total, site) => total + site.totalSiteCost, 0);
      doc.setFontSize(14);
      doc.text(`Grand Total: ₹${grandTotal.toLocaleString()}`, pageWidth / 2, yOffset, { align: 'center' });
    }

    // Save the PDF
    doc.save('purchase-summary.pdf');
    toast.success('PDF exported successfully');
  };

  const exportToExcel = (data: PurchaseData[]) => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Purchase Summary Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [''],
      ['Summary']
    ];

    if (selectedSite !== 'all') {
      const siteName = sites.find(s => s.id === selectedSite)?.name;
      summaryData.push([`Site: ${siteName}`]);
    }

    // Add grand total
    const grandTotal = data.reduce((total, site) => total + site.totalSiteCost, 0);
    summaryData.push(['']);
    summaryData.push(['Grand Total', `₹${grandTotal.toLocaleString()}`]);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Add detailed data sheet
    const detailedData = [
      ['Site', 'Product', 'Quantity', 'Unit', 'Rate/Unit', 'Total Cost']
    ];

    data.forEach(site => {
      site.purchases.forEach(purchase => {
        detailedData.push([
          site.siteName,
          purchase.productName,
          purchase.quantity.toString(),
          purchase.unit,
          `₹${purchase.ratePerUnit.toLocaleString()}`,
          `₹${purchase.totalCost.toLocaleString()}`
        ]);
      });
    });

    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed Data');

    // Save the Excel file
    XLSX.writeFile(wb, 'purchase-summary.xlsx');
    toast.success('Excel file exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Summary</h1>
          <p className="text-gray-600 mt-2">Track costs and expenses across all sites</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            className="flex items-center"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="flex items-center"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filter and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Filter by Site</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white md:col-span-3">
          <CardHeader>
            <CardTitle>Total Purchase Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{selectedSite === 'all' ? grandTotal.toLocaleString() : 
                filteredData.reduce((total, site) => total + site.totalSiteCost, 0).toLocaleString()}
            </div>
            <p className="text-green-100 mt-2">
              {selectedSite === 'all' ? 'Across all sites' : `For ${sites.find(s => s.id === selectedSite)?.name}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Site-wise Breakdown */}
      {filteredData.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">No material usage recorded yet</p>
              <p className="text-sm">Start recording material usage in the Sites page to see the summary here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredData.map((site) => (
          <Card key={site.siteId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{site.siteName}</CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{site.totalSiteCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Cost</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">Product</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-left p-3">Rate/Unit</th>
                      <th className="text-left p-3">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {site.purchases.map((purchase, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{purchase.productName}</td>
                        <td className="p-3">{purchase.quantity} {purchase.unit}</td>
                        <td className="p-3">₹{purchase.ratePerUnit.toLocaleString()}</td>
                        <td className="p-3 font-semibold">₹{purchase.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {selectedSite === 'all' && purchaseData.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Grand Total</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ₹{grandTotal.toLocaleString()}
              </div>
              <p className="text-gray-600 mt-2">Total cost across all sites and projects</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
