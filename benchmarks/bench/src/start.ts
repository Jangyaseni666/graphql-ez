import concurrently from 'concurrently';

function startBench(env: NodeJS.ProcessEnv) {
  return concurrently(
    [
      {
        command: 'wait-on tcp:4000 -s 1 && cross-env PORT=4000 node -r esbuild-register src/bench.ts && kill-port 4000',
        env,
      },
    ],
    {
      raw: true,
    }
  );
}

function api(cwd: string, env: NodeJS.ProcessEnv) {
  return concurrently(
    [
      {
        command: 'pnpm start',
        env: {
          PORT: '4000',
          ...env,
        },
      },
    ],
    {
      cwd,
      raw: true,
    }
  );
}

function benchEZFastify(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-fastify', env),
    startBench({
      TITLE: 'EZ Fastify',
      ...env,
    }),
  ]);
}

function benchEZExpress(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-express', env),
    startBench({
      TITLE: 'EZ Express',
      ...env,
    }),
  ]);
}

function benchEZHapi(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-hapi', env),
    startBench({
      TITLE: 'EZ Hapi',
      ...env,
    }),
  ]);
}

function benchEZHTTP(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-http', env),
    startBench({
      TITLE: 'EZ Node.js HTTP',
      ...env,
    }),
  ]);
}

function benchEZKoa(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-koa', env),
    startBench({
      TITLE: 'EZ Koa',
      ...env,
    }),
  ]);
}

function benchMercurius(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/mercurius', env),
    startBench({
      TITLE: 'Mercurius',
      ...env,
    }),
  ]);
}

function benchRawEnvelop(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/envelop-fastify-raw', env),
    startBench({
      TITLE: 'Envelop Fastify Raw',
      ...env,
    }),
  ]);
}

function benchGraphQLHelix(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/graphql-helix', env),
    startBench({
      TITLE: 'GraphQLHelix',
      ...env,
    }),
  ]);
}

function benchExpressGraphQL(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/express-graphql', env),
    startBench({
      TITLE: 'express-graphql',
      ...env,
    }),
  ]);
}

async function benchCache() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Cache',
    CACHE: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

async function benchJit() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Jit',
    JIT: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

async function benchJitCache() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'JitCache',
    JIT: 'true',
    CACHE: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

async function benchVanilla() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Vanilla',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
  await benchGraphQLHelix(env);
  await benchExpressGraphQL(env);
}

(async () => {
  await concurrently(['rimraf raw_results && pnpm build'], {
    raw: true,
  });

  await benchCache();

  await benchJit();

  await benchJitCache();

  await benchVanilla();

  await concurrently(['pnpm results'], {
    raw: true,
  });
})().catch(console.error);
