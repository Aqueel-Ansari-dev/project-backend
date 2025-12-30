import { Router } from 'express';
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

import {
  createUser,
  findUserByCognitoSub,
  findUserByEmail,
  updateUserProfileByEmail,
} from '../db/user-repository.js';
import { issueToken } from '../utils/jwt.js';
import { calculateSecretHash, cognito, verifyCognitoToken } from '../utils/cognito.js';

const router = Router();

interface RegisterBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyRegNumber?: string;
  sector?: string;
}

interface LoginBody {
  code?: string;
}

function normalizeEmail(value: string | undefined): string {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Email is required');
  }
  return trimmed;
}

router.post('/register', async (req, res, next) => {
  try {
    const body = req.body as RegisterBody;

    const email = normalizeEmail(body.email);
    const password = body.password?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const companyName = body.companyName?.trim();
    const companyRegNumber = body.companyRegNumber?.trim();
    const sector = body.sector?.trim();

    if (!password || password.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    if (!firstName) {
      res.status(400);
      throw new Error('First name is required');
    }

    if (!lastName) {
      res.status(400);
      throw new Error('Last name is required');
    }

    if (!companyName) {
      res.status(400);
      throw new Error('Company name is required');
    }

    if (!companyRegNumber) {
      res.status(400);
      throw new Error('Company registration number is required');
    }

    const signUpInput = {
      ClientId: process.env.COGNITO_CLIENT_ID ?? '',
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    } as const;
    if (!signUpInput.ClientId) {
      throw new Error('COGNITO_CLIENT_ID is not configured');
    }
    const secret = process.env.COGNITO_CLIENT_SECRET;
    const commandInput = secret
      ? { ...signUpInput, SecretHash: calculateSecretHash(email) }
      : signUpInput;

    const response = await cognito.send(new SignUpCommand(commandInput));
    const cognitoSub = response.UserSub;
    if (!cognitoSub) {
      throw new Error('Failed to register user with Cognito');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      await updateUserProfileByEmail({
        email,
        cognitoSub,
        firstName,
        lastName,
        companyName,
        companyRegNumber,
        sector: sector ?? null,
      });
    } else {
      await createUser({
        email,
        cognitoSub,
        firstName,
        lastName,
        companyName,
        companyRegNumber,
        sector,
      });
    }

    res.status(201).json({
      data: { message: 'Please verify your email' },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/callback', async (req, res, next) => {
  try {
    const body = req.body as LoginBody;
    const code = body.code?.trim();
    if (!code) {
      res.status(400);
      throw new Error('Missing authorization code');
    }

    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!domain || !clientId) {
      throw new Error('Cognito domain/client configuration is missing');
    }
    const redirectUri = process.env.COGNITO_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }

    const tokenRes = await fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers,
      body: params.toString(),
    });
    if (!tokenRes.ok) {
      const message = await tokenRes.text();
      res.status(401);
      throw new Error(message || 'Failed to exchange Cognito code');
    }
    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      access_token?: string;
    };
    const idToken = tokenJson.id_token;
    if (!idToken) {
      throw new Error('Cognito did not return an id_token');
    }
    const decoded = await verifyCognitoToken(idToken);

    const existing = await findUserByCognitoSub(decoded.sub);
    const email = normalizeEmail(decoded.email);
    let user = existing;
    if (!user) {
      const byEmail = await findUserByEmail(email);
      if (byEmail) {
        user = await updateUserProfileByEmail({
          email,
          cognitoSub: decoded.sub,
        });
      }
    }
    if (!user) {
      const name = decoded.name?.split(' ') ?? [];
      const firstName = decoded.given_name ?? name[0] ?? 'Cognito';
      const lastName = decoded.family_name ?? name.slice(1).join(' ') || 'User';
      user = await createUser({
        email,
        cognitoSub: decoded.sub,
        firstName,
        lastName,
        companyName: 'Cognito user',
        companyRegNumber: 'N/A',
      });
    }

    const { token, expiresIn } = issueToken({
      sub: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      companyRegNumber: user.company_reg_number,
      sector: user.sector ?? undefined,
      type: 'user',
      roles: decoded['cognito:groups'],
    });

    res.json({
      data: {
        token,
        expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          companyName: user.company_name,
          companyRegNumber: user.company_reg_number,
          sector: user.sector,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
