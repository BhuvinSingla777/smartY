import { NextRequest } from 'next/server';
import { numParam } from '@/lib/http';
import type { BdgListQuery } from '@/lib/services/bdg.service';
import type { PodsListQuery } from '@/lib/services/pods.service';

export function parseBdgQuery(request: NextRequest): BdgListQuery {
  const { searchParams } = request.nextUrl;
  return {
    page: numParam(searchParams.get('page'), 1),
    pageSize: numParam(searchParams.get('pageSize'), 20),
    search: searchParams.get('search') || undefined,
    member: searchParams.get('member') || undefined,
    members: searchParams.get('members') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || undefined,
    periodStart: searchParams.get('periodStart') || undefined,
    periodEnd: searchParams.get('periodEnd') || undefined,
  };
}

export function parsePodsQuery(request: NextRequest): PodsListQuery {
  const { searchParams } = request.nextUrl;
  return {
    page: numParam(searchParams.get('page'), 1),
    pageSize: numParam(searchParams.get('pageSize'), 20),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    statuses: searchParams.get('statuses') || undefined,
    ids: searchParams.get('ids') || undefined,
    developer: searchParams.get('developer') || undefined,
    branch: searchParams.get('branch') || undefined,
    startDateFrom: searchParams.get('startDateFrom') || undefined,
    startDateTo: searchParams.get('startDateTo') || undefined,
    completionMin: numParam(searchParams.get('completionMin')),
    completionMax: numParam(searchParams.get('completionMax')),
    sortBy: searchParams.get('sortBy') || undefined,
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || undefined,
    limit: numParam(searchParams.get('limit')),
  };
}
