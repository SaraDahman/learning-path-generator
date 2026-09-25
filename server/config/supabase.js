import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import AppError from '../errors/AppError.js';

const getEnvValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
};

const supabaseUrl = getEnvValue('SUPABASE_URL', 'SUPABASE_PROJECT_URL');
const supabaseAnonKey = getEnvValue(
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_KEY',
);
const supabaseServiceRoleKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const getPublicSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AppError(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to the connected environment.',
      { statusCode: 503, code: 'SUPABASE_NOT_CONFIGURED' },
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, clientOptions);
};

export const getAdminSupabase = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new AppError(
      'Supabase profile writes are not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the connected environment.',
      { statusCode: 503, code: 'SUPABASE_NOT_CONFIGURED' },
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, clientOptions);
};