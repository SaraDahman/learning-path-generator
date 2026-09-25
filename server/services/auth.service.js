import AppError from '../errors/AppError.js';
import * as userRepository from '../repositories/user.repository.js';

export const register = async ({ username, email, password }) => {
  const authData = await userRepository.signUp({ email, password });

  if (!authData.user) {
    throw new AppError('We could not create your account. Please try again.', {
      statusCode: 400,
      code: 'USER_CREATE_FAILED',
    });
  }

  let profile;
  try {
    profile = await userRepository.createProfile({
      id: authData.user.id,
      username,
      email,
    });
  } catch (error) {
    try {
      await userRepository.deleteAuthUser(authData.user.id);
    } catch (cleanupError) {
      console.error('Auth cleanup failed after profile creation error:', cleanupError);
    }
    throw error;
  }

  return {
    user: profile,
    session: authData.session,
    message: authData.session
      ? 'Account created successfully.'
      : 'Account created. Check your email to confirm your account.',
  };
};

export const login = async ({ email, password }) => {
  const authData = await userRepository.signIn({ email, password });

  const profile = await userRepository.getProfile(authData.user.id);

  return {
    user: profile ?? {
      id: authData.user.id,
      email: authData.user.email,
    },
    session: authData.session,
    message: 'Welcome back.',
  };
};

export const getCurrentUser = async (userId) => {
  const profile = await userRepository.getProfile(userId);

  if (!profile) {
    throw new AppError('Your account profile could not be found.', {
      statusCode: 404,
      code: 'PROFILE_NOT_FOUND',
    });
  }

  return { user: profile };
};

export const logout = async () => ({
  message: 'Signed out.',
});