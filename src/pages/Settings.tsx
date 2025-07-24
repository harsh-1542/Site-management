
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application preferences and configurations</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <User className="mr-2 h-5 w-5" />
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="John" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" defaultValue="+91 9876543210" />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Bell className="mr-2 h-5 w-5" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Low Stock Alerts</div>
              <div className="text-sm text-gray-500">Get notified when products are running low</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Site Updates</div>
              <div className="text-sm text-gray-500">Receive updates about site progress</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Purchase Alerts</div>
              <div className="text-sm text-gray-500">Notifications for new purchases and expenses</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Database className="mr-2 h-5 w-5" />
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <Input id="currency" defaultValue="INR (₹)" readOnly />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="Asia/Kolkata" readOnly />
          </div>
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Input id="dateFormat" defaultValue="DD/MM/YYYY" readOnly />
          </div>
          <div className="pt-4">
            <Button variant="outline">Backup Data</Button>
            <Button variant="outline" className="ml-2">Import Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
