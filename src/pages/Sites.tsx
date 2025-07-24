import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Calendar, User, Loader2, Building2, Pencil, Trash2, AlertCircle, Cloud, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SiteMaterialUsageForm from '@/components/SiteMaterialUsageForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Site {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string | null;
  supervisor: string | null;
  manager: string | null;
  status: 'active' | 'completed' | 'on_hold';
}

interface MaterialUsage {
  id: string;
  product_id: string;
  quantity_used: number;
  usage_date: string;
  notes: string | null;
  product: {
    name: string;
    unit: string;
    rate_per_unit: number;
  };
}

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteSiteId, setDeleteSiteId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newSite, setNewSite] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    supervisor: '',
    manager: ''
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMaterialUsageDialogOpen, setIsMaterialUsageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchMaterialUsage(selectedSite.id);
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSites((data || []).map(site => ({
        ...site,
        status: site.status as 'active' | 'completed' | 'on_hold'
      })));
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast({
        title: "Error",
        description: "Failed to load sites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialUsage = async (siteId: string) => {
    try {
      const { data, error } = await supabase
        .from('site_material_usage')
        .select(`
          *,
          product:inventory_products (
            name,
            unit,
            rate_per_unit
          )
        `)
        .eq('site_id', siteId)
        .order('usage_date', { ascending: false });

      if (error) throw error;
      setMaterialUsage(data || []);
    } catch (error) {
      console.error('Error fetching material usage:', error);
      toast({
        title: "Error",
        description: "Failed to load material usage data.",
        variant: "destructive",
      });
    }
  };

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.location || !newSite.start_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Location, Start Date).",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('sites')
        .insert([{
          name: newSite.name,
          location: newSite.location,
          start_date: newSite.start_date,
          end_date: newSite.end_date || null,
          supervisor: newSite.supervisor || null,
          manager: newSite.manager || null,
          status: 'active' as const
        }])
        .select()
        .single();

      if (error) throw error;

      setSites([{ ...data, status: data.status as 'active' | 'completed' | 'on_hold' }, ...sites]);
      setNewSite({ name: '', location: '', start_date: '', end_date: '', supervisor: '', manager: '' });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Site added successfully!",
      });
    } catch (error) {
      console.error('Error adding site:', error);
      toast({
        title: "Error",
        description: "Failed to add site. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site);
    setIsMaterialUsageDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      default: return status;
    }
  };

  const calculateTotalCost = () => {
    return materialUsage.reduce((total, usage) => {
      return total + (usage.quantity_used * usage.product.rate_per_unit);
    }, 0);
  };

  const handleEditSite = async () => {
    if (!editingSite) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('sites')
        .update({
          name: editingSite.name,
          location: editingSite.location,
          start_date: editingSite.start_date,
          end_date: editingSite.end_date || null,
          supervisor: editingSite.supervisor || null,
          manager: editingSite.manager || null,
          status: editingSite.status
        })
        .eq('id', editingSite.id)
        .select()
        .single();

      if (error) throw error;

      setSites(sites.map(site => 
        site.id === editingSite.id ? { ...data, status: data.status as 'active' | 'completed' | 'on_hold' } : site
      ));
      
      setIsEditDialogOpen(false);
      setEditingSite(null);
      
      toast({
        title: "Success",
        description: "Site updated successfully!",
      });
    } catch (error) {
      console.error('Error updating site:', error);
      toast({
        title: "Error",
        description: "Failed to update site. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!deleteSiteId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', deleteSiteId);

      if (error) throw error;

      setSites(sites.filter(site => site.id !== deleteSiteId));
      setIsDeleteDialogOpen(false);
      setDeleteSiteId(null);
      
      toast({
        title: "Success",
        description: "Site deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: "Error",
        description: "Failed to delete site. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-600 mt-2">Manage all your interior and furniture projects</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newSite.location}
                  onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newSite.start_date}
                    onChange={(e) => setNewSite({ ...newSite, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newSite.end_date}
                    onChange={(e) => setNewSite({ ...newSite, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={newSite.supervisor}
                    onChange={(e) => setNewSite({ ...newSite, supervisor: e.target.value })}
                    placeholder="Enter supervisor name"
                  />
                </div>
                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <Input
                    id="manager"
                    value={newSite.manager}
                    onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                    placeholder="Enter manager name"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSite}
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Site
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {sites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{site.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingSite(site);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeleteSiteId(site.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{site.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(site.start_date).toLocaleDateString()} - 
                    {site.end_date ? new Date(site.end_date).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
                {site.supervisor && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Supervisor: {site.supervisor}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                    {formatStatus(site.status)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSiteClick(site)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Site Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          {editingSite && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Site Name *</Label>
                <Input
                  id="edit-name"
                  value={editingSite.name}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={editingSite.location}
                  onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Start Date *</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingSite.start_date}
                    onChange={(e) => setEditingSite({ ...editingSite, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editingSite.end_date || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-supervisor">Supervisor</Label>
                  <Input
                    id="edit-supervisor"
                    value={editingSite.supervisor || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, supervisor: e.target.value })}
                    placeholder="Enter supervisor name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-manager">Manager</Label>
                  <Input
                    id="edit-manager"
                    value={editingSite.manager || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, manager: e.target.value })}
                    placeholder="Enter manager name"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSite}
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the site
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Material Usage Dialog */}
      <Dialog open={isMaterialUsageDialogOpen} onOpenChange={setIsMaterialUsageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Material Usage - {selectedSite?.name}</DialogTitle>
          </DialogHeader>
          <SiteMaterialUsageForm
            siteId={selectedSite?.id || ''}
            siteName={selectedSite?.name || ''}
            onSuccess={() => {
              if (selectedSite) {
                fetchMaterialUsage(selectedSite.id);
              }
            }}
          />
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Usage History</h3>
            <div className="space-y-4">
              {materialUsage.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{usage.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {usage.quantity_used} {usage.product.unit} used on {new Date(usage.usage_date).toLocaleDateString()}
                    </p>
                    {usage.notes && <p className="text-sm text-gray-500 mt-1">{usage.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(usage.quantity_used * usage.product.rate_per_unit).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₹{usage.product.rate_per_unit}/{usage.product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">
                Total Cost: ₹{calculateTotalCost().toLocaleString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
