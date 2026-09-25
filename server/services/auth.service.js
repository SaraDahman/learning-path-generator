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

  try {
    await userRepository.createProfile({
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
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    session: authData.session,
    message: authData.session
      ? 'Account created successfully.'
      : 'Account created. Check your email to confirm your account.',
  };
};

export const login = async ({ email, password }) => {
  const authData = await userRepository.signIn({ email, password });

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    session: authData.session,
    message: 'Welcome back.',
  };
};