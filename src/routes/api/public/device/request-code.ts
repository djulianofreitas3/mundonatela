import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/device/request-code')({
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
          installation_id: z.string().min(5)
        })

        const result = schema.safeParse(body)
        if (!result.success) {
          return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 })
        }

        const { installation_id } = result.data

        const { data: device, error: devErr } = await supabaseAdmin
          .from('dispositivos')
          .select('id, status')
          .eq('installation_id', installation_id)
          .single()

        if (devErr || !device) {
          return new Response(JSON.stringify({ error: 'Device not registered' }), { status: 404 })
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        const { error: codeErr } = await supabaseAdmin
          .from('codigos_ativacao')
          .insert({
            code,
            installation_id,
            expires_at: expiresAt
          })

        if (codeErr) throw codeErr

        return new Response(JSON.stringify({ 
          success: true, 
          code,
          expires_at: expiresAt
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
