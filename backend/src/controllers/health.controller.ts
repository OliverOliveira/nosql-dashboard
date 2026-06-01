import type { FastifyReply, FastifyRequest } from 'fastify';
import { healthService } from '../services/health.service.js';

export async function getHealth(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send(healthService.getStatus());
}
