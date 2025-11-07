import type { Request } from 'express';

import type { AccountScope } from '../db/account-repository.js';

function normalizeString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeString(entry);
      if (normalized) {
        return normalized;
      }
    }
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return undefined;
}

function pickHeader(req: Request, name: string): string | undefined {
  const raw = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const normalized = normalizeString(entry);
      if (normalized) {
        return normalized;
      }
    }
    return undefined;
  }
  return normalizeString(raw);
}

export function getSmeScope(req: Request): AccountScope {
  const scope: AccountScope = {};
  const user = req.user as (typeof req.user & {
    company_reg_number?: unknown;
    entity_name?: unknown;
    externalId?: unknown;
    account_external_id?: unknown;
  }) | undefined;

  const userCompanyReg = normalizeString(user?.companyRegNumber ?? user?.company_reg_number);
  if (userCompanyReg) {
    scope.companyRegNumber = userCompanyReg;
  }

  const userEntityName = normalizeString(user?.entityName ?? user?.entity_name);
  if (userEntityName) {
    scope.entityName = userEntityName;
  }

  const userExternalId = normalizeString(
    user?.accountExternalId ?? user?.account_external_id ?? user?.externalId
  );
  const userIdCandidate = normalizeString(user?.id);
  if (user?.type && user.type !== 'sandbox') {
    if (userExternalId) {
      scope.accountExternalId = userExternalId;
    } else if (userIdCandidate) {
      scope.accountExternalId = userIdCandidate;
    }
  }

  const headerCompanyReg = pickHeader(req, 'x-company-reg-number') ?? pickHeader(req, 'x-sme-id');
  if (headerCompanyReg && !scope.companyRegNumber) {
    scope.companyRegNumber = headerCompanyReg;
  }

  const headerEntityName = pickHeader(req, 'x-entity-name') ?? pickHeader(req, 'x-sme-name');
  if (headerEntityName && !scope.entityName) {
    scope.entityName = headerEntityName;
  }

  const headerExternalId =
    pickHeader(req, 'x-account-external-id') ?? pickHeader(req, 'x-account-id');
  if (headerExternalId && !scope.accountExternalId) {
    scope.accountExternalId = headerExternalId;
  }

  const queryCompanyReg = normalizeString((req.query as Record<string, unknown>)['company_reg_number']);
  if (queryCompanyReg && !scope.companyRegNumber) {
    scope.companyRegNumber = queryCompanyReg;
  }

  const queryEntityName = normalizeString((req.query as Record<string, unknown>)['entity_name']);
  if (queryEntityName && !scope.entityName) {
    scope.entityName = queryEntityName;
  }

  return scope;
}

export function hasSmeScope(scope: AccountScope): boolean {
  return Boolean(scope.companyRegNumber || scope.entityName || scope.accountExternalId);
}
