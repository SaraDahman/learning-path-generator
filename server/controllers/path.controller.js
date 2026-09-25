import * as pathService from '../services/path.service.js';

export const generate = async (req, res) => {
  const result = await pathService.generatePath(req.user.id, req.body);
  res.status(201).json(result);
};
