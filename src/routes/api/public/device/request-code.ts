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
          installation_id: z.string().min(5),
          force_new: z.boolean().optional()
        })

        const result = schema.safeParse(body)
        if (!result.success) {
          return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 })
        }

        const { installation_id, force_new } = result.data

        const { data: device, error: devErr } = await supabaseAdmin
          .from('dispositivos')
          .select('id, status')
          .eq('installation_id', installation_id)
          .single()

        if (devErr || !device) {
          return new Response(JSON.stringify({ error: 'Device not registered' }), { status: 404 })
        }

        // Check for existing pending request
        const { data: existingCode } = await supabaseAdmin
          .from('codigos_ativacao')
          .select('id, code, request_id, poll_token')
          .eq('installation_id', installation_id)
          .is('used_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingCode && !force_new) {
          return new Response(JSON.stringify({ 
            success: true, 
            code: existingCode.code,
            request_id: existingCode.request_id,
            poll_token: existingCode.poll_token,
            expires_at: null
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // If force_new or no existing code, invalidate previous ones if any
        if (existingCode && force_new) {
          // Invalidate previous ones by setting used_at (or we could delete them, but marking as used/cancelled is safer for history)
          await supabaseAdmin
            .from('codigos_ativacao')
            .update({ used_at: new Date().toISOString() }) // Use now to invalidate
            .eq('installation_id', installation_id)
            .is('used_at', null)
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase()

        const { data: newCode, error: codeErr } = await supabaseAdmin
          .from('codigos_ativacao')
          .insert({
            code,
            installation_id,
            expires_at: null
          })
          .select('request_id, poll_token')
          .single()

        if (codeErr) throw codeErr

        return new Response(JSON.stringify({ 
          success: true, 
          code,
          request_id: newCode.request_id,
          poll_token: newCode.poll_token,
          expires_at: null
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
