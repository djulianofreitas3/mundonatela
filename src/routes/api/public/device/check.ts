import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/device/check')({
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
          installation_id: z.string().min(5),
          device_token: z.string().uuid().optional()
        })

        const result = schema.safeParse(body)
        if (!result.success) return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 })

        const { installation_id, device_token } = result.data

        const query = supabaseAdmin
          .from('dispositivos')
          .select(`
            id, 
            status, 
            expires_at, 
            device_token,
            cliente:clientes(nome, status),
            listas:dispositivo_lista(
              lista:listas_iptv(nome, url, usuario, senha, status)
            )
          `)
          .eq('installation_id', installation_id)
          .single()

        const { data: device, error } = await query
        if (error || !device) return new Response(JSON.stringify({ error: 'Device not found' }), { status: 404 })

        if (device.status === 'active' && device.device_token !== device_token) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const isExpired = device.expires_at ? new Date(device.expires_at) < new Date() : false
        const effectiveStatus = isExpired ? 'expired' : device.status

        await supabaseAdmin
          .from('dispositivos')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', device.id)

        return new Response(JSON.stringify({
          status: effectiveStatus,
          expires_at: device.expires_at,
          config: effectiveStatus === 'active' ? {
            client_name: (device.cliente as any)?.nome,
            lists: (device.listas as any[]).map(l => ({
              name: l.lista.nome,
              url: l.lista.url,
              username: l.lista.usuario,
              password: l.lista.senha
            }))
          } : null
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
      }
    }
  }
}
