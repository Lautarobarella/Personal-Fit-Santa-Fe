# Etapa 1: Build con Node.js
FROM node:18-alpine AS builder
WORKDIR /app

# Declarar argumentos de build para variables de entorno de Next.js
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_MP_PUBLIC_KEY
ARG NEXT_PUBLIC_MP_ENVIRONMENT
ARG NEXT_PUBLIC_IS_DOCKER

# Establecer las variables de entorno para el build
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY
ENV NEXT_PUBLIC_MP_ENVIRONMENT=$NEXT_PUBLIC_MP_ENVIRONMENT
ENV NEXT_PUBLIC_IS_DOCKER=$NEXT_PUBLIC_IS_DOCKER
COPY Frontend/package*.json ./

RUN npm install
COPY Frontend/ ./
RUN npm run build

# Etapa 2: Runtime con Node.js
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]