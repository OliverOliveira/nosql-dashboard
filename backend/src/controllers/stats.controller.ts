import type { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';
import { statsService } from '../services/stats.service.js';

interface GroupByRoute extends RouteGenericInterface {
  Params: {
    field: string;
  };
}

export async function getSummary(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const summary = await statsService.getSummary(request.server.firestore);

  reply.status(200).send(summary);
}

export async function getGroupByField(
  request: FastifyRequest<GroupByRoute>,
  reply: FastifyReply,
): Promise<void> {
  const { field } = request.params;
  const result = await statsService.getGroupByField(request.server.firestore, field);

  reply.status(200).send(result);
}
