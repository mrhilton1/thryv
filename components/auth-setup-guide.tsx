'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ExternalLink, User, Settings, Database, Shield } from 'lucide-react'

export function AuthSetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepNumber) 
        ? prev.filter(n => n !== stepNumber)
        : [...prev, stepNumber]
    )
  }

  const steps = [
    {
      id: 1,
      title: "Enable Authentication in Supabase",
      description: "Go to your Supabase Dashboard and enable email/password authentication",
      icon: <Settings className="h-5 w-5" />,
      instructions: [
        "Go to your Supabase Dashboard",
        "Click on 'Authentication' in the left sidebar",
        "Go to 'Settings' tab",
        "Under 'Auth Providers', make sure 'Email' is enabled",
        "Set 'Enable email confirmations' to OFF for testing (you can enable later)",
        "Click 'Save'"
      ],
      link: "https://supabase.com/dashboard/project"
    },
    {
      id: 2,
      title: "Create Your First Admin User",
      description: "Sign up through Supabase Auth UI or SQL",
      icon: <User className="h-5 w-5" />,
      instructions: [
        "Option A - Through Supabase Dashboard:",
        "• Go to Authentication → Users",
        "• Click 'Add user'",
        "• Enter email and password",
        "• Click 'Create user'",
        "",
        "Option B - Through SQL (run in SQL Editor):",
        "• Use the SQL command shown below"
      ],
      sqlCommand: `-- Create admin user via SQL
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourcompany.com', -- Change this email
  crypt('your-password-here', gen_salt('bf')), -- Change this password
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  '',
  '',
  '',
  ''
);`
    },
    {
      id: 3,
      title: "Set User Role to Admin",
      description: "Update the user's role in the profiles table",
      icon: <Shield className="h-5 w-5" />,
      instructions: [
        "After creating the user, update their role to 'admin'",
        "Run this SQL command in the SQL Editor:",
        "Replace 'admin@yourcompany.com' with your actual email"
      ],
      sqlCommand: `-- Set user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@yourcompany.com'
);`
    },
    {
      id: 4,
      title: "Test Database Connection",
      description: "Verify everything is working correctly",
      icon: <Database className="h-5 w-5" />,
      instructions: [
        "Click the 'Test Database Connection' button below",
        "All tables should show as 'Connected'",
        "If any issues, check the console for errors"
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 Supabase Authentication Setup</h1>
        <p className="text-muted-foreground">
          Follow these steps to enable authentication for your Executive Dashboard
        </p>
      </div>

      <div className="grid gap-6">
        {steps.map((step) => (
          <Card key={step.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    completedSteps.includes(step.id) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Step {step.id}: {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.link && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={step.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </a>
                    </Button>
                  )}
                  <Button
                    variant={completedSteps.includes(step.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStep(step.id)}
                  >
                    {completedSteps.includes(step.id) ? "✓ Done" : "Mark Done"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  {step.instructions.map((instruction, index) => (
                    <div key={index} className={`text-sm ${
                      instruction.startsWith('•') ? 'ml-4 text-muted-foreground' :
                      instruction.startsWith('Option') ? 'font-medium' :
                      instruction === '' ? 'h-2' :
                      'text-muted-foreground'
                    }`}>
                      {instruction}
                    </div>
                  ))}
                </div>
                
                {step.sqlCommand && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">SQL Command</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(step.sqlCommand!)}
                      >
                        Copy SQL
                      </Button>
                    </div>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      <code>{step.sqlCommand}</code>
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">🎉 Ready to Go!</CardTitle>
          <CardDescription className="text-green-600">
            Once you complete all steps above, your Executive Dashboard will be ready with:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
            <div className="space-y-1">
              <div>✅ Supabase Authentication</div>
              <div>✅ Role-based Access Control</div>
              <div>✅ Secure RLS Policies</div>
            </div>
            <div className="space-y-1">
              <div>✅ Admin User Account</div>
              <div>✅ Avatar Storage</div>
              <div>✅ Production-Ready Security</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
