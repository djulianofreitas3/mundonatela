import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/device/poll')({
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
          request_id: z.string().uuid(),
          poll_token: z.string().uuid()
        })

        const result = schema.safeParse(body)
        if (!result.success) return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 })

        const { request_id, poll_token } = result.data

        const { data: codeData, error: codeErr } = await supabaseAdmin
          .from('codigos_ativacao')
          .select('used, expires_at, installation_id')
          .eq('request_id', request_id)
          .eq('poll_token', poll_token)
          .single()

        if (codeErr || !codeData) {
          return new Response(JSON.stringify({ status: 'rejected', error: 'Request not found or invalid tokens' }), { status: 404 })
        }

        const isExpired = new Date(codeData.expires_at) < new Date()
        
        if (isExpired && !codeData.used) {
          return new Response(JSON.stringify({ status: 'expired' }), { status: 200 })
        }

        if (codeData.used) {
          // Check if device is indeed active
          const { data: device, error: devErr } = await supabaseAdmin
            .from('dispositivos')
            .select('status, device_token')
            .eq('installation_id', codeData.installation_id)
            .single()

          if (devErr || !device) return new Response(JSON.stringify({ status: 'rejected' }), { status: 200 })
          
          if (device.status === 'active') {
            return new Response(JSON.stringify({ 
              status: 'approved',
              device_token: device.device_token
            }), { status: 200 })
          }

          return new Response(JSON.stringify({ status: device.status }), { status: 200 })
        }

        return new Response(JSON.stringify({ status: 'pending' }), { status: 200 })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
      }
    }
  }
}
