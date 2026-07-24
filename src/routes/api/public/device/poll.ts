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
          .select('used_at, expires_at, installation_id, poll_token')
          .eq('request_id', request_id)
          .single()

        if (codeErr || !codeData) {
          return new Response(JSON.stringify({ status: 'rejeitado', error: 'Request not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
        }

        // Validate poll_token manually to provide better error but keep security
        if (codeData.poll_token !== poll_token) {
           return new Response(JSON.stringify({ status: 'rejeitado', error: 'Invalid poll token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        }

        const isExpired = codeData.expires_at ? new Date(codeData.expires_at) < new Date() : false
        
        if (isExpired && !codeData.used_at) {
          return new Response(JSON.stringify({ status: 'expirado' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        if (codeData.used_at) {
          // Check if device is indeed active
          const { data: device, error: devErr } = await supabaseAdmin
            .from('dispositivos')
            .select('status, device_token')
            .eq('installation_id', codeData.installation_id)
            .single()

          if (devErr || !device) return new Response(JSON.stringify({ status: 'rejeitado' }), { status: 200 })
          
          if (device.status === 'active') {
            return new Response(JSON.stringify({ 
              status: 'aprovado',
              device_token: device.device_token
            }), { status: 200, headers: { 'Content-Type': 'application/json' } })
          }

          const statusMap: Record<string, string> = {
            'active': 'ativo',
            'pending': 'pendente',
            'expired': 'expirado',
            'blocked': 'bloqueado',
            'removed': 'bloqueado'
          }
          return new Response(JSON.stringify({ status: statusMap[device.status as string] || device.status }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ status: 'pendente' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
      }
    }
  }
}
