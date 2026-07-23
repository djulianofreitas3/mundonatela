import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/device/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const body = await request.json()
          
          const schema = z.object({
            installation_id: z.string().min(5),
            device_name: z.string().optional(),
            android_version: z.string().optional(),
            app_version: z.string().optional(),
          })

          const result = schema.safeParse(body)
          if (!result.success) {
            return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.format() }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          const { installation_id, device_name, android_version, app_version } = result.data

          // Upsert device
          const { data, error } = await supabaseAdmin
            .from('dispositivos')
            .upsert({
              installation_id,
              device_name,
              android_version,
              app_version,
              updated_at: new Date().toISOString()
            }, { onConflict: 'installation_id' })
            .select()
            .single()

          if (error) throw error

          return new Response(JSON.stringify({ 
            success: true, 
            device_id: data.id,
            status: data.status 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
