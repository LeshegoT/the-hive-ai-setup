import { handleErrors } from '@the-hive/lib-core';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { IsAdminUser } from '../queries/security.queries';
import graphApi from '../shared/graph-api';

export const router = Router();

router.get(
  '/security',
  handleErrors(async (req: Request<never, boolean, never, {upn:string}>, res: Response<boolean>) => {
    const authenticated = await IsAdminUser(req.query.upn);
    res.json(authenticated);
  })
);

router.get(
  '/ad-groups/:upn',
  handleErrors(async (req: Request<{upn:string}, string[]>, res: Response<string[]>) => {
    const groups = await getUserGroups(req.params.upn);
    res.json(groups);
  })
);

export async function getUserGroups(upn: string): Promise<string[]> {
    const data: { value?: {displayName:string}[], error?: {code?: string} } = await graphApi.get(
      `/users/${upn}/transitiveMemberOf/microsoft.graph.group?$count=true&$select=displayName`,
      false
    );

    if (!data.value || data?.error?.code === 'Request_ResourceNotFound') {
      return [];
    } else {
       return  data.value.map((group: {displayName:string}) => group.displayName);
    }
}
