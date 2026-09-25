import AppError from '../errors/AppError.js';
import { getPublicSupabase } from '../config/supabase.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const authorization = req.get('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!token) {
      throw new AppError('Authentication is required.', {
        statusCode: 401,
        code: 'UNAUTHENTICATED',
      });
    }

    const { data, error } = await getPublicSupabase().auth.getUser(token);
    if (error || !data.user) {
      throw new AppError('Your session is invalid or has expired.', {
        statusCode: 401,
        code: 'UNAUTHENTICATED',
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
};