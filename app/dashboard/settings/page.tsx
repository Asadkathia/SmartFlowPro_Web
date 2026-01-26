'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your company preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation (Mock) */}
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start bg-slate-100 font-bold">Company Profile</Button>
                    <Button variant="ghost" className="justify-start text-slate-500 font-normal">Billing & Tax</Button>
                    <Button variant="ghost" className="justify-start text-slate-500 font-normal">Team Roles</Button>
                    <Button variant="ghost" className="justify-start text-slate-500 font-normal">Notifications</Button>
                    <Button variant="ghost" className="justify-start text-slate-500 font-normal">Integrations</Button>
                </div>

                {/* Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Details</CardTitle>
                            <CardDescription>This information will appear on your invoices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Name</label>
                                    <Input defaultValue="SmartFlowPro Services" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input defaultValue="support@smartflow.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone</label>
                                        <Input defaultValue="(555) 123-4567" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <Input defaultValue="123 Service Road" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">City</label>
                                        <Input defaultValue="Tech City" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">State</label>
                                        <Input defaultValue="TC" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Zip</label>
                                        <Input defaultValue="90210" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button>Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>Upload your logo and set brand colors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                                    <span className="text-xs text-slate-400 font-medium">Logo</span>
                                </div>
                                <div>
                                    <Button variant="outline" size="sm">Upload New Logo</Button>
                                    <p className="text-xs text-slate-500 mt-2">Recommended size: 200x200px</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
