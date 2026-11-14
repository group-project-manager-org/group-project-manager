import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabaseServer';
import { buildSummaryInput, gatherActivity, SUMMARY_SYSTEM_PROMPT, toMemberSummaries } from '@/lib/summary';
import type { MemberSummariesResponse } from '@/lib/api';

export const maxDuration = 60;

const CACHE_MS = 60 * 60 * 1000;
const DEFAULT_MODEL = 'claude-opus-5-5';
// Models that accept server-side refusal fallbacks (`fallbacks: "default"`).
const FALLBACK_MODELS = new Set(['claude-fable-5-2', 'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);

const OutputSchema = z.object({
  members: z.array(z.object({ key: z.string(), summary: z.string() })),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** POST /api/projects/[id]/summary -> { members: MemberSummary[], generated_at }. Members only; cached 1 hour. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return fail('You must be signed in', 401);

  const projectId = Number((await params).id);
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return fail('Invalid project id', 400);

  const sb = await createServerSupabase();
  const { data: isMember, error: memberErr } = await sb.rpc('is_project_member', { p_project_id: projectId });
  if (memberErr) return fail(memberErr.message, 500);
  if (!isMember) return fail('Project not found', 404);

  const { data: cached } = await sb.from('member_summaries').select('generated_at, payload').eq('project_id', projectId).maybeSingle();
  if (cached && Date.now() - new Date(cached.generated_at).getTime() < CACHE_MS) {
    return NextResponse.json(cached.payload as MemberSummariesResponse);
  }

  if (!process.env.ANTHROPIC_API_KEY) return fail('AI summaries are not configured (ANTHROPIC_API_KEY is missing)', 503);

  const { people, modelInput } = buildSummaryInput(await gatherActivity(sb, projectId));
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  let output: z.infer<typeof OutputSchema>;
  try {
    const client = new Anthropic();
    const response = await client.beta.messages.parse({
      model,
      max_tokens: 16000,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify({ members: modelInput }) }],
      output_config: { effort: 'low', format: betaZodOutputFormat(OutputSchema) },
      ...(FALLBACK_MODELS.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return fail('The AI could not summarise this project right now. Try again later.', 502);
    }
    output = response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return fail('AI summaries are busy. Try again in a minute.', 503);
    if (err instanceof Anthropic.APIError) return fail(`AI request failed (${err.status ?? 'network'})`, 502);
    throw err;
  }

  const result: MemberSummariesResponse = {
    members: toMemberSummaries(people, output),
    generated_at: new Date().toISOString(),
  };

  // Cache with the service key (clients can't write this table). Without the key, just skip caching.
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (secret) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, { auth: { persistSession: false } });
    await admin.from('member_summaries').upsert({ project_id: projectId, generated_at: result.generated_at, payload: result });
  }
  return NextResponse.json(result);
}
