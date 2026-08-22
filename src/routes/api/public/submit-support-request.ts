import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/submit-support-request')({
  component: () => null,
  loader: () => {
    throw new Error('This is a server-only API route')
  }
})

// @ts-ignore
Route.options.server = {
  handlers: {
    POST: async ({ request }: { request: Request }) => {
      try {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const body = await request.json()
        
        const schema = z.object({
          request_type: z.enum(['content_request', 'problem_report']),
          category: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          content_name: z.string().optional(),
          year: z.string().optional(),
          season: z.string().optional(),
          city_state: z.string().optional(),
          device_id: z.string().optional(),
          installation_id: z.string().optional(),
          device_name: z.string().optional(),
          device_manufacturer: z.string().optional(),
          device_model: z.string().optional(),
          device_type: z.string().optional(),
          android_version: z.string().optional(),
          app_version: z.string().optional(),
          version_code: z.number().optional(),
          xtream_username: z.string().optional(),
          content_id: z.string().optional(),
          series_id: z.string().optional(),
          season_number: z.number().optional(),
          episode_id: z.string().optional(),
          episode_number: z.number().optional(),
        })

        const result = schema.safeParse(body)
        if (!result.success) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid input', details: result.error.format() }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Force admin-only fields to defaults/null
        const finalData = {
          ...result.data,
          status: 'new',
          admin_note: null,
          created_at: new Date().toISOString(),
        }

        const { data, error } = await supabaseAdmin
          .from('support_requests')
          .insert(finalData)
          .select('id')
          .single()

        if (error) {
          console.error('Error inserting support request:', error)
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ success: true, id: data.id }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }
}
