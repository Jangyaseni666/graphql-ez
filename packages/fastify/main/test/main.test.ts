import EventSource from 'eventsource';
import { printSchema } from 'graphql';
import { CommonSchema, expectCommonQueryStream, PingSubscription, startFastifyServer } from 'graphql-ez-testing';

test.concurrent('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      cors: true,
      async buildContext(args) {
        return {
          foo: 'bar',
          ip: args.fastify?.request.ip,
        };
      },
    },
  });

  expect(
    JSON.parse(
      (
        await query<{
          context: string;
        }>(`{context}`)
      ).data!.context.replace(new RegExp(addressWithoutProtocol, 'g'), '__host__')
    )
  ).toMatchInlineSnapshot(`
    Object {
      "document": Object {
        "definitions": Array [
          Object {
            "directives": Array [],
            "kind": "OperationDefinition",
            "loc": Object {
              "end": 9,
              "start": 0,
            },
            "operation": "query",
            "selectionSet": Object {
              "kind": "SelectionSet",
              "loc": Object {
                "end": 9,
                "start": 0,
              },
              "selections": Array [
                Object {
                  "arguments": Array [],
                  "directives": Array [],
                  "kind": "Field",
                  "loc": Object {
                    "end": 8,
                    "start": 1,
                  },
                  "name": Object {
                    "kind": "Name",
                    "loc": Object {
                      "end": 8,
                      "start": 1,
                    },
                    "value": "context",
                  },
                },
              ],
            },
            "variableDefinitions": Array [],
          },
        ],
        "kind": "Document",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
      },
      "foo": "bar",
      "ip": "127.0.0.1",
      "operation": Object {
        "directives": Array [],
        "kind": "OperationDefinition",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
        "operation": "query",
        "selectionSet": Object {
          "kind": "SelectionSet",
          "loc": Object {
            "end": 9,
            "start": 0,
          },
          "selections": Array [
            Object {
              "arguments": Array [],
              "directives": Array [],
              "kind": "Field",
              "loc": Object {
                "end": 8,
                "start": 1,
              },
              "name": Object {
                "kind": "Name",
                "loc": Object {
                  "end": 8,
                  "start": 1,
                },
                "value": "context",
              },
            },
          ],
        },
        "variableDefinitions": Array [],
      },
      "request": Object {
        "body": Object {
          "query": "{context}",
        },
        "headers": Object {
          "connection": "keep-alive",
          "content-length": "21",
          "content-type": "application/json",
          "host": "__host__",
        },
        "method": "POST",
        "query": Object {},
      },
    }
  `);

  expect(printSchema((await ezApp.getEnveloped)().schema)).toMatchInlineSnapshot(`
"type Query {
  hello: String!
  users: [User!]!
  stream: [String!]!
  context: String!
}

type User {
  id: Int!
}
"
`);
});

test.concurrent('query with @stream', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  await expectCommonQueryStream(address);
});

test.concurrent('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  const eventSource = new EventSource(`${address}/graphql?query=subscription{ping}`);

  let n = 0;
  const payload = await new Promise<string>(resolve => {
    eventSource.addEventListener('message', (event: any) => {
      switch (++n) {
        case 1:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong1',
            },
          });
        case 2:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong2',
            },
          });
        case 3:
          expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong3',
            },
          });
          return resolve('OK');
        default:
          console.error(event);
          throw Error('Unexpected event');
      }
    });
  }).catch(err => {
    eventSource.close();
    throw err;
  });
  eventSource.close();
  expect(payload).toBe('OK');
});
