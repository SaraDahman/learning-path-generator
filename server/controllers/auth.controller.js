import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
};

export const me = async (req, res) => {
  const result = await authService.getCurrentUser(req.user.id);
  res.json(result);
};

export const logout = async (req, res) => {
  const result = await authService.logout(req.user.id);
  res.json(result);
};