import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const Route = createFileRoute('/api/public/submit-support-request')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          
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
          });

          const validatedData = schema.parse(body);

          // Force admin-only fields to defaults/null
          const finalData = {
            ...validatedData,
            status: 'new',
            admin_note: null,
            created_at: new Date().toISOString(),
          };

          const { data, error } = await supabaseAdmin
            .from('support_requests')
            .insert(finalData)
            .select('id')
            .single();

          if (error) {
            console.error('Error inserting support request:', error);
            return new Response(JSON.stringify({ success: false, error: error.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, id: data.id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
