---
title: ExpressJS Prisma
description: An ExpressJS server that uses Prisma to connect to a PostgreSQL database
tags:
  - express
  - postgresql
  - prisma
  - typescript
  - redis
---

# ExpressJS Prisma

This is an [ExpressJS](https://expressjs.com/) REST API that uses [Prisma](https://www.prisma.io/) to connect to a Postgres database, Redis and CRUD chat.

## ✨ Features

- Prisma
- Express
- Mongodb
- TypeScript
- Redis

## 💁‍♀️ How to use

- Install dependencies `yarn` or `pnpm install`
- [Provision a Postgres container on Railway](https://dev.new)
- Connect to your Railway project with `railway link`
- Migrate the database `railway run yarn migrate:dev`
- Run the Server app `railway run yarn dev`

## 📝 Notes

This is a REST API for chat . The available routes are

- `POST /auth/register` creates a new user using `email or username` and `password` in the JSON body
- `POST /auth/login` logs in a user using `email or username` and `password` in the JSON body
- `GET /auth/verify-email/:verifyToken` refreshes the token using `refreshToken` in the params
- `POST /auth/forgot-password` sends a reset password email using `email` in the JSON body
- `POST /auth/reset-password/:resetToken` resets the password using `password` in the JSON body
- `GET /auth/logout` logs out a user
- `GET /auth/me` gets the current user
- `GET /auth/refresh-token` refreshes the token

