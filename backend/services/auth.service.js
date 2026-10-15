import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import config from '../config/env.js';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const signUp = async ({ email, password, name }) => {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name?.trim() || email.split('@')[0],
      password: password || null,
    },
  });

  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
};

export const signIn = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // If password comparison is needed in local auth, check here
  if (user.password && password && user.password !== password) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
};

export const getMe = async (userId) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    // If demo user or just created, create default user record
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@kinetic.app`,
        name: 'Kinetic User',
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  return user;
};
