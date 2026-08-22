import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/support-requests')({
  component: () => null,
  loader: () => {
    throw new Error('This is a server-only API route')
  }
})

// @ts-ignore
Route.options.server = {
  handlers: {
    GET: async ({ request }: { request: Request }) => {
      try {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const url = new URL(request.url)
        const xtream_username = url.searchParams.get('xtream_username')
        const installation_id = url.searchParams.get('installation_id')
        const authHeader = request.headers.get('Authorization')

        if (!xtream_username || !installation_id || !authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ success: false, error: 'Missing credentials' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const deviceToken = authHeader.split(' ')[1]

        // 1. Verify device ownership/token
        const { data: device, error: deviceError } = await supabaseAdmin
          .from('dispositivos')
          .select('id')
          .eq('installation_id', installation_id)
          .eq('device_token', deviceToken)
          .single()

        if (deviceError || !device) {
          return new Response(JSON.stringify({ success: false, error: 'Unauthorized device' }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // 2. Fetch requests for this username
        const { data: requests, error } = await supabaseAdmin
          .from('support_requests')
          .select('id, request_type, category, content_name, title, description, year, season, status, admin_note, created_at, updated_at')
          .eq('xtream_username', xtream_username)
          .order('created_at', { ascending: false })

        if (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Map status to Portuguese labels for client consumption if needed, 
        // but here we return raw and the app handles it per instructions.
        return new Response(JSON.stringify({ success: true, data: requests }), {
          status: 200,
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