'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, Save } from 'lucide-react'

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure platform-wide settings and defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credit Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Free Tier Monthly Credits</Label>
                <Input type="number" defaultValue={10} />
              </div>
              <div className="space-y-2">
                <Label>Starter Tier Monthly Credits</Label>
                <Input type="number" defaultValue={100} />
              </div>
              <div className="space-y-2">
                <Label>Pro Tier Monthly Credits</Label>
                <Input type="number" defaultValue={500} />
              </div>
              <div className="space-y-2">
                <Label>Enterprise Tier Monthly Credits</Label>
                <Input type="number" defaultValue={2000} />
              </div>
            </div>
          </div>

          {/* Processing Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Processing Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Processing</Label>
                  <div className="text-sm text-gray-500">
                    Automatically start job processing
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Queue System</Label>
                  <div className="text-sm text-gray-500">
                    Use job queue for processing
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Max Concurrent Jobs</Label>
                <Input type="number" defaultValue={10} />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Send email notifications to users
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Send WhatsApp notifications
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Admin Alerts</Label>
                  <div className="text-sm text-gray-500">
                    Receive alerts for system issues
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Maintenance</h3>
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-red-900">Maintenance Mode</Label>
                <div className="text-sm text-red-700">
                  Temporarily disable the platform for maintenance
                </div>
              </div>
              <Switch />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
