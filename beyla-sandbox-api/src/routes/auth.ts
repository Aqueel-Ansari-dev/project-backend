import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { createUser, findUserByEmail } from '../db/user-repository.js';
import { issueToken } from '../utils/jwt.js';

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
  email?: string;
  password?: string;
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

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409);
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      companyName,
      companyRegNumber,
      sector,
    });

    const { token, expiresIn } = issueToken({
      sub: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      companyRegNumber: user.company_reg_number,
      sector: user.sector ?? undefined,
      type: 'user',
    });

    res.status(201).json({
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

router.post('/login', async (req, res, next) => {
  try {
    const body = req.body as LoginBody;

    const email = normalizeEmail(body.email);
    const password = body.password?.trim();

    if (!password) {
      res.status(400);
      throw new Error('Password is required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      res.status(401);
      throw new Error('Invalid email or password');
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
