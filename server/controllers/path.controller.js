import * as pathService from '../services/path.service.js';

export const generate = async (req, res) => {
  const result = await pathService.generatePath(req.user.id, req.body);
  res.status(201).json(result);
};

export const list = async (req, res) => {
  const result = await pathService.listPaths(req.user.id);
  res.json({ paths: result });
};

export const getOne = async (req, res) => {
  const result = await pathService.getPath(req.user.id, req.params.id);
  res.json(result);
};

export const setStepCompletion = async (req, res) => {
  const result = await pathService.setStepCompletion(
    req.user.id,
    req.params.id,
    req.params.stepId,
    req.body.is_completed,
  );
  res.json(result);
};

export const remove = async (req, res) => {
  const result = await pathService.deletePath(req.user.id, req.params.id);
  res.json(result);
};
