# Convex — saved reference for StreetShift

Sources (fetched 2026-10-24), each page fetched as markdown from docs.convex.dev (index: https://docs.convex.dev/llms.txt).
Every section below is a verbatim copy of the page named in its "Source:" line.

## KEY FACTS (summary written by the doc fetcher)
- Package: `npm install convex`. Dev: `npx convex dev` (first run logs in via browser, creates deployment, writes `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to `.env.local`).
- Server functions live in `convex/` and import from `./_generated/server` (`query`, `mutation`, `action`, `internalQuery`, `internalMutation`, `internalAction`, `httpAction`); validators from `convex/values` (`v`); schema via `defineSchema`/`defineTable` from `convex/server`.
- Node runtime actions: put `"use node";` at top of the file; that file may contain only actions.
- Scheduling: `ctx.scheduler.runAfter(ms, internal.x.y, args)` / `runAt`; crons in `convex/crons.ts` with `cronJobs()`.
- File storage: `ctx.storage.generateUploadUrl()` (mutation), `ctx.storage.store(blob)` (action), `ctx.storage.getUrl(id)`.
- Node script client: `import { ConvexHttpClient } from "convex/browser"`.
- Env vars for functions: `npx convex env set NAME value`; read with `process.env.NAME`.

---



---

<!-- Source: https://docs.convex.dev/quickstart/react -->
Source: https://docs.convex.dev/quickstart/react

# React Quickstart

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

[YouTube video player](https://www.youtube.com/embed/4MgsvjMb59Q)

To get setup quickly with Convex and React run

**`npm create convex@latest`**

or follow the guide below.

***

Learn how to query data from Convex in a React app using Vite.

1. Create a React app

   Create a React app using the `create vite` command.

   ```
   npm create vite@latest my-app -- --template react-ts
   ```

2. Install the Convex client and server library

   To get started, install the `convex` package which provides a convenient interface for working with Convex from a React app.

   Navigate to your app directory and install `convex`.

   ```
   cd my-app && npm install convex
   ```

3. Set up a Convex dev deployment

   Next, run `npx convex dev`. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.

   It will also create a `convex/` folder for you to write your backend API functions in. The `dev` command will then continue running to sync your functions with your dev deployment in the cloud.

   ```
   npx convex dev
   ```

4. Create sample data for your database

   In a new terminal window, create a `sampleData.jsonl` file with some sample data.

   sampleData.jsonl

   ```
   {"text": "Buy groceries", "isCompleted": true}

   {"text": "Go for a swim", "isCompleted": true}

   {"text": "Integrate Convex", "isCompleted": false}
   ```

5. Add the sample data to your database

   Now that your project is ready, add a `tasks` table with the sample data into your Convex database with the `import` command.

   ```
   npx convex import --table tasks sampleData.jsonl
   ```

6. (optional) Define a schema

   Add a new file `schema.ts` in the `convex/` folder with a description of your data.

   This will declare the types of your data for optional typechecking with TypeScript, and it will be also enforced at runtime.

   convex/schema.ts

   ```
   import { defineSchema, defineTable } from "convex/server";

   import { v } from "convex/values";



   export default defineSchema({

     tasks: defineTable({

       text: v.string(),

       isCompleted: v.boolean(),

     }),

   });
   ```

7. Expose a database query

   Add a new file `tasks.ts` in the `convex/` folder with a query function that loads the data.

   Exporting a query function from this file declares an API function named after the file and the export name, `api.tasks.get`.

   convex/tasks.ts

   ```
   import { query } from "./_generated/server";



   export const get = query({

     args: {},

     handler: async (ctx) => {

       return await ctx.db.query("tasks").collect();

     },

   });
   ```

8. Connect the app to your backend

   In `src/main.tsx`, create a `ConvexReactClient` and pass it to a `ConvexProvider` wrapping your app.

   src/main.tsx

   ```
   import React from "react";

   import ReactDOM from "react-dom/client";

   import App from "./App";

   import "./index.css";

   import { ConvexProvider, ConvexReactClient } from "convex/react";



   const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



   ReactDOM.createRoot(document.getElementById("root")!).render(

     <React.StrictMode>

       <ConvexProvider client={convex}>

         <App />

       </ConvexProvider>

     </React.StrictMode>,

   );
   ```

9. Display the data in your app

   In `src/App.tsx`, use the `useQuery` hook to fetch from your `api.tasks.get` API function and display the data.

   src/App.tsx

   ```
   import "./App.css";

   import { useQuery } from "convex/react";

   import { api } from "../convex/_generated/api";



   function App() {

     const tasks = useQuery(api.tasks.get);

     return (

       <div className="App">

         {tasks?.map(({ _id, text }) => (

           <div key={_id}>{text}</div>

         ))}

       </div>

     );

   }



   export default App;
   ```

10. Start the app

    Start the app, open <http://localhost:5173/> in a browser, and see the list of tasks.

    ```
    npm run dev
    ```

See the complete [React documentation](/client/react/overview.md).


---

<!-- Source: https://docs.convex.dev/quickstart/nodejs -->
Source: https://docs.convex.dev/quickstart/nodejs

# Node.js Quickstart

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Learn how to query data from Convex in a Node.js project.

For instructions for subscriptions instead of point-in-time queries and more project configurations (TypeScript, bundlers, CJS vs ESM) see [Node.js notes](/client/javascript/node.md).

1. Create a new npm project

   Create a new directory for your Node.js project.

   ```
   mkdir my-project && cd my-project && npm init -y && npm pkg set type="module"
   ```

2. Install the Convex client and server library

   Install the `convex` package which provides a convenient interface for working with Convex from JavaScript.

   Also install the `dotenv` library for loading `.env` files.

   ```
   npm install convex dotenv
   ```

3. Set up a Convex dev deployment

   Next, run `npx convex dev`. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.

   It will also create a `convex/` folder for you to write your backend API functions in. The `dev` command will then continue running to sync your functions with your dev deployment in the cloud.

   ```
   npx convex dev
   ```

4. Create sample data for your database

   In a new terminal window, create a `sampleData.jsonl` file with some sample data.

   sampleData.jsonl

   ```
   {"text": "Buy groceries", "isCompleted": true}

   {"text": "Go for a swim", "isCompleted": true}

   {"text": "Integrate Convex", "isCompleted": false}
   ```

5. Add the sample data to your database

   Now that your project is ready, add a `tasks` table with the sample data into your Convex database with the `import` command.

   ```
   npx convex import --table tasks sampleData.jsonl
   ```

6. Expose a database query

   Add a new file `tasks.ts` in the `convex/` folder with a query function that loads the data.

   Exporting a query function from this file declares an API function named after the file and the export name, `api.tasks.get`.

   convex/tasks.ts

   ```
   import { query } from "./_generated/server";



   export const get = query({

     args: {},

     handler: async (ctx) => {

       return await ctx.db.query("tasks").collect();

     },

   });
   ```

7. Connect the script to your backend

   In a new file `script.js`, create a `ConvexHttpClient` using the URL of your development environment.

   script.js

   ```
   import { ConvexHttpClient } from "convex/browser";

   import { api } from "./convex/_generated/api.js";

   import * as dotenv from "dotenv";

   dotenv.config({ path: ".env.local" });



   const client = new ConvexHttpClient(process.env["CONVEX_URL"]);



   client.query(api.tasks.get).then(console.log);
   ```

8. Run the script

   Run the script from the same directory and see the list of tasks logged to the terminal.

   ```
   node script.js
   ```

See the complete [Node.js documentation](/client/javascript/node.md).


---

<!-- Source: https://docs.convex.dev/database/schemas -->
Source: https://docs.convex.dev/database/schemas

# Schemas

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

A schema is a description of

1. the tables in your Convex project
2. the type of documents within your tables

While it is possible to use Convex *without* defining a schema, adding a `schema.ts` file will ensure that the documents in your tables are the correct type. If you're using [TypeScript](/understanding/best-practices/typescript.md), adding a schema will also give you end-to-end type safety throughout your app.

We recommend beginning your project without a schema for rapid prototyping and then adding a schema once you've solidified your plan. To learn more see our [Schema Philosophy](/database/advanced/schema-philosophy.md).

**Example:** [TypeScript and Schemas](https://github.com/convex/convex-demos/tree/main/typescript)

## Writing schemas[​](#writing-schemas "Direct link to Writing schemas")

Schemas are defined in a `schema.ts` file in your `convex/` directory and look like:

convex/schema.ts

```
import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";



export default defineSchema({

  messages: defineTable({

    body: v.string(),

    user: v.id("users"),

  }),

  users: defineTable({

    name: v.string(),

    tokenIdentifier: v.string(),

  }).index("by_token", ["tokenIdentifier"]),

});
```

This schema (which is based on our [users and auth example](https://github.com/convex/convex-demos/tree/main/users-and-auth)), has 2 tables: messages and users. Each table is defined using the [`defineTable`](/api/modules/server.md#definetable) function. Within each table, the document type is defined using the validator builder, [`v`](/api/modules/values.md#v). In addition to the fields listed, Convex will also automatically add `_id` and `_creationTime` fields. To learn more, see [System Fields](/database/types.md#system-fields).

Generating a Schema

While writing your schema, it can be helpful to consult the [Convex Dashboard](/dashboard/deployments/schema.md). The "View schema file" panel on the "Schema" page can generate a schema declaration based on the data in your tables.

### Validators[​](#validators "Direct link to Validators")

The validator builder, [`v`](/api/modules/values.md#v) is used to define the type of documents in each table. It has methods for each of [Convex's types](/database/types.md):

convex/schema.ts

```
import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";



export default defineSchema({

  documents: defineTable({

    id: v.id("documents"),

    string: v.string(),

    number: v.number(),

    boolean: v.boolean(),

    commitTs: v.commitTs(),

    nestedObject: v.object({

      property: v.string(),

    }),

  }),

});
```

It additionally allows you to define unions, optional property, string literals, and more. [Argument validation](/functions/validation.md) and schemas both use the same validator builder, `v`.

#### Optional fields[​](#optional-fields "Direct link to Optional fields")

You can describe optional fields by wrapping their type with `v.optional(...)`:

```
defineTable({

  optionalString: v.optional(v.string()),

  optionalNumber: v.optional(v.number()),

});
```

This corresponds to marking fields as optional with `?` in TypeScript.

#### Unions[​](#unions "Direct link to Unions")

You can describe fields that could be one of multiple types using `v.union`:

```
defineTable({

  stringOrNumber: v.union(v.string(), v.number()),

});
```

If your table stores multiple different types of documents, you can use `v.union` at the top level:

```
defineTable(

  v.union(

    v.object({

      kind: v.literal("StringDocument"),

      value: v.string(),

    }),

    v.object({

      kind: v.literal("NumberDocument"),

      value: v.number(),

    }),

  ),

);
```

In this schema, documents either have a `kind` of `"StringDocument"` and a string for their `value`:

```
{

  "kind": "StringDocument",

  "value": "abc"

}
```

or they have a `kind` of `"NumberDocument"` and a number for their `value`:

```
{

  "kind": "NumberDocument",

  "value": 123

}
```

#### Literals[​](#literals "Direct link to Literals")

Fields that are a constant can be expressed with `v.literal`:

```
defineTable({

  oneTwoOrThree: v.union(

    v.literal("one"),

    v.literal("two"),

    v.literal("three"),

  ),

});
```

#### Record objects[​](#record-objects "Direct link to Record objects")

You can describe objects that map arbitrary keys to values with `v.record`:

```
defineTable({

  simpleMapping: v.record(v.string(), v.boolean()),

});
```

You can use other types of string validators for the keys:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    userIdToValue: v.record(v.id("users"), v.boolean()),

  },

  handler: async ({ db }, { userIdToValue }) => {

    //...

  },

});
```

Notes:

* This type corresponds to the [Record\<K,V>](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type) type in TypeScript
* You cannot use string literals as a `record` key
* Using `v.string()` as a `record` key validator will only allow ASCII characters

#### Any[​](#any "Direct link to Any")

Fields or documents that could take on any value can be represented with `v.any()`:

```
defineTable({

  anyValue: v.any(),

});
```

This corresponds to the `any` type in TypeScript.

### Options[​](#options "Direct link to Options")

These options are passed as part of the [options](/api/interfaces/server.DefineSchemaOptions.md) argument to [`defineSchema`](/api/modules/server.md#defineschema).

#### `schemaValidation: boolean`[​](#schemavalidation-boolean "Direct link to schemavalidation-boolean")

Whether Convex should validate at runtime that your documents match your schema.

By default, Convex will enforce that all new and existing documents match your schema.

You can disable `schemaValidation` by passing in `schemaValidation: false`:

```
defineSchema(

  {

    // Define tables here.

  },

  {

    schemaValidation: false,

  },

);
```

When `schemaValidation` is disabled, Convex will not validate that new or existing documents match your schema. You'll still get schema-specific TypeScript types, but there will be no validation at runtime that your documents match those types.

#### `strictTableNameTypes: boolean`[​](#stricttablenametypes-boolean "Direct link to stricttablenametypes-boolean")

Whether the TypeScript types should allow accessing tables not in the schema.

By default, the TypeScript table name types produced by your schema are strict. That means that they will be a union of strings (ex. `"messages" | "users"`) and only support accessing tables explicitly listed in your schema.

Sometimes it's useful to only define part of your schema. For example, if you are rapidly prototyping, it could be useful to try out a new table before adding it your `schema.ts` file.

You can disable `strictTableNameTypes` by passing in `strictTableNameTypes: false`:

```
defineSchema(

  {

    // Define tables here.

  },

  {

    strictTableNameTypes: false,

  },

);
```

When `strictTableNameTypes` is disabled, the TypeScript types will allow access to tables not listed in the schema and their document type will be `any`.

Regardless of the value of `strictTableNameTypes`, your schema will only validate documents in the tables listed in the schema. You can still create and modify documents in other tables in JavaScript or on the dashboard (they just won't be validated).

## Schema validation[​](#schema-validation "Direct link to Schema validation")

Schemas are pushed automatically in [`npx convex dev`](/cli/reference/dev.md) and [`npx convex deploy`](/cli/reference/deploy.md).

The first push after a schema is added or modified will validate that all existing documents match the schema. If there are documents that fail validation, the push will fail.

After the schema is pushed, Convex will validate that all future document inserts and updates match the schema.

Schema validation is skipped if [`schemaValidation`](#schemavalidation-boolean) is set to `false`.

Note that schemas only validate documents in the tables listed in the schema. You can still create and modify documents in other tables (they just won't be validated).

### Staged validators[​](#staged-validators "Direct link to Staged validators")

Staged validators let you validate a schema change in the background without delaying deployment. Use them when tightening a table's validator would require a long scan of existing documents. The current validator remains enforced on writes while validation runs. Once validation succeeds, you can promote the change without repeating the scan.

For example, say a table's `value` field is declared as `v.union(v.string(), v.number())` because older documents store `"123"` as a string while newer ones store `123` as a number. You want to migrate the strings to numbers and enforce `value: v.number()`. You also want to remove an optional `legacy` field while keeping `label` unchanged.

#### Stage and validate the change[​](#stage-and-validate-the-change "Direct link to Stage and validate the change")

1. Update any functions that write documents to use the new field types, and migrate existing documents. For this example, convert string values to numbers and remove `legacy` from every document. The current validator must continue to accept these writes.

2. Keep the current validator in `defineTable` and chain `.staged()` with only the fields you want to add, change, or remove:

   ```
   export default defineSchema({

     documents: defineTable({

       label: v.string(),

       value: v.union(v.string(), v.number()),

       legacy: v.optional(v.string()),

     }).staged({

       value: v.number(),

       legacy: undefined,

     }),

   });
   ```

   Fields omitted from `.staged()` keep their current validators. Here, the staged validator keeps `label: v.string()`, tightens `value` to `v.number()`, and removes `legacy` by setting it to `undefined`. This will validate that no documents have that field. Use `v.optional(...)` to allow the field to be present or unset. Staging a removal does not delete data from existing documents.

   Each supplied validator replaces the entire field validator. To change a nested object, pass `nested: v.object({ ... })` with the complete desired definition of that object, including any nested fields you want to keep. You can also pass a full schema validator, such as `v.object({ ... })` or `v.union(...)`, to specify the entire staged document type. Use this form for tables whose current validator is a union. For a table defined with `v.any()`, a field map defines the complete staged object type: include every field you want that object to allow.

   Put all changes that require revalidating this table in `.staged()` and keep its enforced validator unchanged, so the scan runs in the background.

3. Run `npx convex deploy`. Convex scans existing documents against the staged validator in the background and checks every new write against it. Writes continue to enforce the current validator. A write that passes the current validator but fails the staged validator succeeds and marks staged validation as failed, even if the background scan had already finished.

4. Check progress with `npx convex deploy --dry-run`. The CLI reports each staged table as validating, validated, or failed, with a progress count or the first validation error. Wait for the state to be validated before promoting. If validation fails, follow the retry steps below.

#### Promote a validated change[​](#promote-a-validated-change "Direct link to Promote a validated change")

When you're ready to start enforcing the new validator, follow these steps.

1. Confirm the staged validation state with `npx convex deploy --dry-run`.

2. Update `defineTable` to the complete staged document type and remove `.staged()`:

   ```
   export default defineSchema({

     documents: defineTable({

       label: v.string(),

       value: v.number(),

     }),

   });
   ```

3. Run `npx convex deploy` again. Convex reuses the completed staged validation, so this deploy skips the table scan and does not ask for confirmation to remove the staged validator. The new validator becomes enforced on writes.

You can also reuse completed staged validation when the new enforced validator accepts every document the staged validator accepts, such as changing a staged field from `v.number()` to `v.union(v.number(), v.string())`.

#### Retry a failed validation[​](#retry-a-failed-validation "Direct link to Retry a failed validation")

If validation fails, follow these steps to resolve and retry a staged validation.

1. Inspect the reported validation error. Each attempt reports only the first offending document it finds, so use a query or migration to find and fix all offending documents. Fix any functions that still write documents rejected by the staged validator.
2. Keep the same `.staged()` definition and deploy again. This retries validation from the beginning, scanning the whole table in the background.
3. Wait for the validation state to be validated, then follow the promotion steps above. Repeat the repair and retry steps if another document fails.

#### Promote before validation succeeds[​](#promote-before-validation-succeeds "Direct link to Promote before validation succeeds")

If you want to stop the background validation and start enforcing immediately, follow these steps. Note: this is generally not recommended, as it may take a long time to complete.

1. Update `defineTable` to the desired validator and remove `.staged()`.
2. Deploy. Convex runs normal schema validation because the pending or failed staged result cannot prove that all documents match. If this requires a full table scan, the deploy blocks until that expensive scan finishes. Existing documents that fail the new validator cause the deploy to fail.

If staged validation is still running, the CLI asks for confirmation because this push cancels that background validation and clears its progress. Pass `--allow-unstaging-schema` to skip the prompt. If staged validation has failed, the CLI proceeds without this prompt; schema validation can still require the same full table scan.

#### Change or remove a staged validator[​](#change-or-remove-a-staged-validator "Direct link to Change or remove a staged validator")

* Deploying the same staged validator preserves validation that is running or already validated. Deploying it again after a failure retries the scan.
* Changing a successfully validated `.staged()` validator to a more permissive one preserves its validated state without another scan. For example, you can change a staged field from `v.number()` to `v.union(v.number(), v.string())`. The replacement must accept every document the previous staged validator accepts. The CLI does not ask for confirmation because the completed validation is reused.
* Other changes to `.staged()` start a new validation. Changing a validator that is still running or has failed restarts the scan, including when making it more permissive. Each table can have at most one staged validator.
* Removing a staged validator, or changing it without reusing its validation, clears its validation progress. Staging it again later starts a new scan. The CLI asks for confirmation before clearing running or validated progress; pass `--allow-unstaging-schema` to skip the prompt. Promotion of a validated change follows the reuse rules above.

### Circular references[​](#circular-references "Direct link to Circular references")

You might want to define a schema with circular ID references like:

convex/schema.ts

```
import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";



export default defineSchema({

  users: defineTable({

    preferencesId: v.id("preferences"),

  }),

  preferences: defineTable({

    userId: v.id("users"),

  }),

});
```

In this schema, documents in the `users` table contain a reference to documents in `preferences` and vice versa.

Because schema validation enforces your schema on every `db.insert`, `db.replace`, and `db.patch` call, creating circular references like this is not possible.

The easiest way around this is to make one of the references nullable:

convex/schema.ts

```
import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";



export default defineSchema({

  users: defineTable({

    preferencesId: v.id("preferences"),

  }),

  preferences: defineTable({

    userId: v.union(v.id("users"), v.null()),

  }),

});
```

This way you can create a preferences document first, then create a user document, then set the reference on the preferences document:

convex/users.ts

```
import { mutation } from "./_generated/server";



export default mutation({

  handler: async (ctx) => {

    const preferencesId = await ctx.db.insert("preferences", {});

    const userId = await ctx.db.insert("users", { preferencesId });

    await ctx.db.patch("preferences", preferencesId, { userId });

  },

});
```

[Let us know](/production/contact.md) if you need better support for circular references.

## TypeScript types[​](#typescript-types "Direct link to TypeScript types")

Once you've defined a schema, [`npx convex dev`](/cli/reference/dev.md) will produce new versions of [`dataModel.d.ts`](/generated-api/data-model.md) and [`server.d.ts`](/generated-api/server.md) with types based on your schema.

### `Doc<TableName>`[​](#doctablename "Direct link to doctablename")

The [`Doc`](/generated-api/data-model.md#doc) TypeScript type from [`dataModel.d.ts`](/generated-api/data-model.md) provides document types for all of your tables. You can use these both when writing Convex functions and in your React components:

MessageView\.tsx

```
import { Doc } from "../convex/_generated/dataModel";



function MessageView(props: { message: Doc<"messages"> }) {

  ...

}
```

If you need the type for a portion of a document, use the [`Infer` type helper](/functions/validation.md#extracting-typescript-types).

### `query` and `mutation`[​](#query-and-mutation "Direct link to query-and-mutation")

The [`query`](/generated-api/server.md#query) and [`mutation`](/generated-api/server.md#mutation) functions in [`server.js`](/generated-api/server.md) have the same API as before but now provide a `db` with more precise types. Functions like [`db.insert(table, document)`](/api/interfaces/server.GenericDatabaseWriter.md#insert) now understand your schema. Additionally [database queries](/database/reading-data/.md) will now return the correct document type (not `any`).

Related posts from

<!-- -->

[![Stack](/img/stack-logo-dark.svg)![Stack](/img/stack-logo-light.svg)](https://stack.convex.dev/)


---

<!-- Source: https://docs.convex.dev/functions/query-functions -->
Source: https://docs.convex.dev/functions/query-functions

# Queries

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Queries are the bread and butter of your backend API. They fetch data from the database, check authentication or perform other business logic, and return data back to the client application.

This is an example query, taking in named arguments, reading data from the database and returning a result:

convex/myFunctions.ts

```
import { query } from "./_generated/server";

import { v } from "convex/values";



// Return the last 100 tasks in a given task list.

export const getTaskList = query({

  args: { taskListId: v.id("taskLists") },

  handler: async (ctx, args) => {

    const tasks = await ctx.db

      .query("tasks")

      .withIndex("by_task_list_id", (q) => q.eq("taskListId", args.taskListId))

      .order("desc")

      .take(100);

    return tasks;

  },

});
```

Read on to understand how to build queries yourself.

## Query names[​](#query-names "Direct link to Query names")

Queries are defined in TypeScript files inside your `convex/` directory.

The path and name of the file, as well as the way the function is exported from the file, determine the name the client will use to call it:

convex/myFunctions.ts

```
// This function will be referred to as `api.myFunctions.myQuery`.

export const myQuery = …;



// This function will be referred to as `api.myFunctions.sum`.

export const sum = …;
```

To structure your API you can nest directories inside the `convex/` directory:

convex/foo/myQueries.ts

```
// This function will be referred to as `api.foo.myQueries.listMessages`.

export const listMessages = …;
```

Default exports receive the name `default`.

convex/myFunctions.ts

```
// This function will be referred to as `api.myFunctions.default`.

export default …;
```

The same rules apply to [mutations](/functions/mutation-functions.md) and [actions](/functions/actions.md), while [HTTP actions](/functions/http-actions.md) use a different routing approach.

Client libraries in languages other than JavaScript and TypeScript use strings instead of API objects:

* `api.myFunctions.myQuery` is `"myFunctions:myQuery"`
* `api.foo.myQueries.myQuery` is `"foo/myQueries:myQuery"`.
* `api.myFunction.default` is `"myFunction:default"` or `"myFunction"`.

## The `query` constructor[​](#the-query-constructor "Direct link to the-query-constructor")

To actually declare a query in Convex you use the `query` constructor function. Pass it an object with a `handler` function, which returns the query result:

convex/myFunctions.ts

```
import { query } from "./_generated/server";



export const myConstantString = query({

  args: {},

  handler: () => {

    return "My never changing string";

  },

});
```

### Query arguments[​](#query-arguments "Direct link to Query arguments")

Queries accept named arguments. The argument values are accessible as fields of the second parameter of the handler function:

convex/myFunctions.ts

```
import { query } from "./_generated/server";



export const sum = query({

  handler: (_, args: { a: number; b: number }) => {

    return args.a + args.b;

  },

});
```

Arguments and responses are automatically serialized and deserialized, and you can pass and return most value-like JavaScript data to and from your query.

To both declare the types of arguments and to validate them, add an `args` object using `v` validators:

convex/myFunctions.ts

```
import { query } from "./_generated/server";

import { v } from "convex/values";



export const sum = query({

  args: { a: v.number(), b: v.number() },

  handler: (_, args) => {

    return args.a + args.b;

  },

});
```

See [argument validation](/functions/validation.md) for the full list of supported types and validators.

The first parameter of the handler function contains the query context.

### Query responses[​](#query-responses "Direct link to Query responses")

Queries can return values of any supported [Convex type](/functions/validation.md) which will be automatically serialized and deserialized.

Queries can also return `undefined`, which is not a valid Convex value. When a query returns `undefined` **it is translated to `null`** on the client.

### Query context[​](#query-context "Direct link to Query context")

The `query` constructor enables fetching data, and other Convex features by passing a [QueryCtx](/generated-api/server.md#queryctx) object to the handler function as the first parameter:

convex/myFunctions.ts

```
import { query } from "./_generated/server";

import { v } from "convex/values";



export const myQuery = query({

  args: { a: v.number(), b: v.number() },

  handler: (ctx, args) => {

    // Do something with `ctx`

  },

});
```

Which part of the query context is used depends on what your query needs to do:

* To fetch from the database use the `db` field. Note that we make the handler function an `async` function so we can `await` the promise returned by `db.get()`:

  convex/myFunctions.ts

  ```
  import { query } from "./_generated/server";

  import { v } from "convex/values";



  export const getTask = query({

    args: { id: v.id("tasks") },

    handler: async (ctx, args) => {

      return await ctx.db.get("tasks", args.id);

    },

  });
  ```

  Read more about [Reading Data](/database/reading-data/.md).

* To return URLs to stored files use the `storage` field. Read more about [File Storage](/file-storage/overview.md).

* To check user authentication use the `auth` field. Read more about [Authentication](/auth/overview.md).

## Splitting up query code via helpers[​](#splitting-up-query-code-via-helpers "Direct link to Splitting up query code via helpers")

When you want to split up the code in your query or reuse logic across multiple Convex functions you can define and call helper functions:

convex/myFunctions.ts

```
import { Id } from "./_generated/dataModel";

import { query, QueryCtx } from "./_generated/server";

import { v } from "convex/values";



export const getTaskAndAuthor = query({

  args: { id: v.id("tasks") },

  handler: async (ctx, args) => {

    const task = await ctx.db.get("tasks", args.id);

    if (task === null) {

      return null;

    }

    return { task, author: await getUserName(ctx, task.authorId ?? null) };

  },

});



async function getUserName(ctx: QueryCtx, userId: Id<"users"> | null) {

  if (userId === null) {

    return null;

  }

  return (await ctx.db.get("users", userId))?.name;

}
```

You can `export` helpers to use them across multiple files. They will not be callable from outside of your Convex functions.

See [Type annotating server side helpers](/understanding/best-practices/typescript.md#type-annotating-server-side-helpers) for more guidance on TypeScript types.

## Using NPM packages[​](#using-npm-packages "Direct link to Using NPM packages")

Queries can import NPM packages installed in `node_modules`. Not all NPM packages are supported, see [Runtimes](/functions/runtimes.md#default-convex-runtime) for more details.

```
npm install @faker-js/faker
```

convex/myFunctions.ts

```
import { query } from "./_generated/server";

import { faker } from "@faker-js/faker";



export const randomName = query({

  args: {},

  handler: () => {

    faker.seed();

    return faker.person.fullName();

  },

});
```

## Calling queries from clients[​](#calling-queries-from-clients "Direct link to Calling queries from clients")

To call a query from [React](/client/react/overview.md) use the [`useQuery`](/client/react/overview.md#fetching-data) hook along with the generated [`api`](/generated-api/api.md) object.

src/MyApp.tsx

```
import { useQuery } from "convex/react";

import { api } from "../convex/_generated/api";



export function MyApp() {

  const data = useQuery(api.myFunctions.sum, { a: 1, b: 2 });

  // do something with `data`

}
```

See the [React](/client/react/overview.md) client documentation for all the ways queries can be called.

## Caching & reactivity & consistency[​](#caching--reactivity--consistency "Direct link to Caching & reactivity & consistency")

Queries have three awesome attributes:

1. **Caching**: Convex caches query results automatically. If many clients request the same query, with the same arguments, they will receive a cached response.
2. **Reactivity**: clients can subscribe to queries to receive new results when the underlying data changes.
3. **Consistency**: All database reads inside a single query call are performed at the same logical timestamp. Concurrent writes do not affect the query results.

To have these attributes the handler function must be *deterministic*, which means that given the same arguments (including the query context) it will return the same response.

For this reason queries cannot `fetch` from third party APIs. To call third party APIs, use [actions](/functions/actions.md).

You might wonder whether you can use non-deterministic language functionality like `Math.random()` or `Date.now()`. The short answer is that Convex takes care of implementing these in a way that you don't have to think about the deterministic constraint.

See [Runtimes](/functions/runtimes.md#default-convex-runtime) for more details on the Convex runtime.

## Limits[​](#limits "Direct link to Limits")

Queries have a limit to the amount of data they can read at once to guarantee good performance. Check out these limits in [Read/write limit errors](/functions/error-handling/.md#readwrite-limit-errors).

See [Write performance and limits](/database/writing-data.md#write-performance-and-limits) for tools to stay within these limits: measuring document sizes, limiting paginated reads with `maximumBytesRead`/`maximumRowsRead`, checking headroom via `ctx.meta.getTransactionMetrics()`, and bounding nested `ctx.runQuery` calls with a `transactionLimits` option.

For information on other limits, see [Limits](/production/state/limits.md).


---

<!-- Source: https://docs.convex.dev/functions/mutation-functions -->
Source: https://docs.convex.dev/functions/mutation-functions

# Mutations

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Mutations insert, update and remove data from the database, check authentication or perform other business logic, and optionally return a response to the client application.

This is an example mutation, taking in named arguments, writing data to the database and returning a result:

convex/myFunctions.ts

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



// Create a new task with the given text

export const createTask = mutation({

  args: { text: v.string() },

  handler: async (ctx, args) => {

    const newTaskId = await ctx.db.insert("tasks", { text: args.text });

    return newTaskId;

  },

});
```

Read on to understand how to build mutations yourself.

## Mutation names[​](#mutation-names "Direct link to Mutation names")

Mutations follow the same naming rules as queries, see [Query names](/functions/query-functions.md#query-names).

Queries and mutations can be defined in the same file when using named exports.

## The `mutation` constructor[​](#the-mutation-constructor "Direct link to the-mutation-constructor")

To declare a mutation in Convex use the `mutation` constructor function. Pass it an object with a `handler` function, which performs the mutation:

convex/myFunctions.ts

```
import { mutation } from "./_generated/server";



export const mutateSomething = mutation({

  args: {},

  handler: () => {

    // implementation will be here

  },

});
```

Unlike a query, a mutation can but does not have to return a value.

### Mutation arguments[​](#mutation-arguments "Direct link to Mutation arguments")

Just like queries, mutations accept named arguments, and the argument values are accessible as fields of the second parameter of the `handler` function:

convex/myFunctions.ts

```
import { mutation } from "./_generated/server";



export const mutateSomething = mutation({

  handler: (_, args: { a: number; b: number }) => {

    // do something with `args.a` and `args.b`



    // optionally return a value

    return "success";

  },

});
```

Arguments and responses are automatically serialized and deserialized, and you can pass and return most value-like JavaScript data to and from your mutation.

To both declare the types of arguments and to validate them, add an `args` object using `v` validators:

convex/myFunctions.ts

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export const mutateSomething = mutation({

  args: { a: v.number(), b: v.number() },

  handler: (_, args) => {

    // do something with `args.a` and `args.b`

  },

});
```

See [argument validation](/functions/validation.md) for the full list of supported types and validators.

The first parameter to the handler function is reserved for the mutation context.

### Mutation responses[​](#mutation-responses "Direct link to Mutation responses")

Queries can return values of any supported [Convex type](/functions/validation.md) which will be automatically serialized and deserialized.

Mutations can also return `undefined`, which is not a valid Convex value. When a mutation returns `undefined` **it is translated to `null`** on the client.

### Mutation context[​](#mutation-context "Direct link to Mutation context")

The `mutation` constructor enables writing data to the database, and other Convex features by passing a [MutationCtx](/generated-api/server.md#mutationctx) object to the handler function as the first parameter:

convex/myFunctions.ts

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export const mutateSomething = mutation({

  args: { a: v.number(), b: v.number() },

  handler: (ctx, args) => {

    // Do something with `ctx`

  },

});
```

Which part of the mutation context is used depends on what your mutation needs to do:

* To read from and write to the database use the `db` field. Note that we make the handler function an `async` function so we can `await` the promise returned by `db.insert()`:

  convex/myFunctions.ts

  ```
  import { mutation } from "./_generated/server";

  import { v } from "convex/values";



  export const addItem = mutation({

    args: { text: v.string() },

    handler: async (ctx, args) => {

      await ctx.db.insert("tasks", { text: args.text });

    },

  });
  ```

  Read on about [Writing Data](/database/writing-data.md).

* To generate upload URLs for storing files use the `storage` field. Read on about [File Storage](/file-storage/overview.md).

* To check user authentication use the `auth` field. Read on about [Authentication](/auth/overview.md).

* To schedule functions to run in the future, use the `scheduler` field. Read on about [Scheduled Functions](/scheduling/scheduled-functions.md).

## Splitting up mutation code via helpers[​](#splitting-up-mutation-code-via-helpers "Direct link to Splitting up mutation code via helpers")

When you want to split up the code in your mutation or reuse logic across multiple Convex functions you can define and call helper functions:

convex/myFunctions.ts

```
import { v } from "convex/values";

import { mutation, MutationCtx } from "./_generated/server";



export const addItem = mutation({

  args: { text: v.string() },

  handler: async (ctx, args) => {

    await ctx.db.insert("tasks", { text: args.text });

    await trackChange(ctx, "addItem");

  },

});



async function trackChange(ctx: MutationCtx, type: "addItem" | "removeItem") {

  await ctx.db.insert("changes", { type });

}
```

Mutations can call helpers that take a [QueryCtx](/generated-api/server.md#queryctx) as argument, since the mutation context can do everything query context can.

You can `export` helpers to use them across multiple files. They will not be callable from outside of your Convex functions.

See [Type annotating server side helpers](/understanding/best-practices/typescript.md#type-annotating-server-side-helpers) for more guidance on TypeScript types.

## Using NPM packages[​](#using-npm-packages "Direct link to Using NPM packages")

Mutations can import NPM packages installed in `node_modules`. Not all NPM packages are supported, see [Runtimes](/functions/runtimes.md#default-convex-runtime) for more details.

```
npm install @faker-js/faker
```

convex/myFunctions.ts

```
import { faker } from "@faker-js/faker";

import { mutation } from "./_generated/server";



export const randomName = mutation({

  args: {},

  handler: async (ctx) => {

    faker.seed();

    await ctx.db.insert("tasks", { text: "Greet " + faker.person.fullName() });

  },

});
```

## Calling mutations from clients[​](#calling-mutations-from-clients "Direct link to Calling mutations from clients")

To call a mutation from [React](/client/react/overview.md) use the [`useMutation`](/client/react/overview.md#editing-data) hook along with the generated [`api`](/generated-api/api.md) object.

src/myApp.tsx

```
import { useMutation } from "convex/react";

import { api } from "../convex/_generated/api";



export function MyApp() {

  const mutateSomething = useMutation(api.myFunctions.mutateSomething);

  const handleClick = () => {

    mutateSomething({ a: 1, b: 2 });

  };

  // pass `handleClick` to a button

  // ...

}
```

See the [React](/client/react/overview.md) client documentation for all the ways queries can be called.

When mutations are called from the [React](/client/react/overview.md) or [Rust](/client/rust.md) clients, they are executed one at a time in a single, ordered queue. You don't have to worry about mutations editing the database in a different order than they were triggered.

## Transactions[​](#transactions "Direct link to Transactions")

Mutations run **transactionally**. This means that:

1. All database reads inside the transaction get a consistent view of the data in the database. You don't have to worry about a concurrent update changing the data in the middle of the execution.
2. All database writes get committed together. If the mutation writes some data to the database, but later throws an error, no data is actually written to the database.

For this to work, similarly to queries, mutations must be deterministic, and cannot call third party APIs. To call third party APIs, use [actions](/functions/actions.md).

## Limits[​](#limits "Direct link to Limits")

Mutations have a limit to the amount of data they can read and write at once to guarantee good performance. Learn more in [Read/write limit errors](/functions/error-handling/.md#readwrite-limit-errors).

See [Write performance and limits](/database/writing-data.md#write-performance-and-limits) for tools to stay within these limits: measuring document sizes, checking headroom via `ctx.meta.getTransactionMetrics()`, and bounding nested calls (`ctx.runQuery`, `ctx.runMutation`) with a `transactionLimits` option.

For information on other limits, see [Limits](/production/state/limits.md).


---

<!-- Source: https://docs.convex.dev/functions/actions -->
Source: https://docs.convex.dev/functions/actions

# Actions

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Actions can call third party services to do things such as processing a payment with [Stripe](https://stripe.com). They can be run in Convex's JavaScript environment or in Node.js. They can interact with the database indirectly by calling [queries](/functions/query-functions.md) and [mutations](/functions/mutation-functions.md).

**Example:** [GIPHY Action](https://github.com/convex/convex-demos/tree/main/giphy-action)

## Action names[​](#action-names "Direct link to Action names")

Actions follow the same naming rules as queries, see [Query names](/functions/query-functions.md#query-names).

## The `action` constructor[​](#the-action-constructor "Direct link to the-action-constructor")

To declare an action in Convex you use the action constructor function. Pass it an object with a `handler` function, which performs the action:

convex/myFunctions.ts

```
import { action } from "./_generated/server";



export const doSomething = action({

  args: {},

  handler: () => {

    // implementation goes here



    // optionally return a value

    return "success";

  },

});
```

Unlike a query, an action can but does not have to return a value.

### Action arguments and responses[​](#action-arguments-and-responses "Direct link to Action arguments and responses")

Action arguments and responses follow the same rules as [mutations](/functions/mutation-functions.md#mutation-arguments):

convex/myFunctions.ts

```
import { action } from "./_generated/server";

import { v } from "convex/values";



export const doSomething = action({

  args: { a: v.number(), b: v.number() },

  handler: (_, args) => {

    // do something with `args.a` and `args.b`



    // optionally return a value

    return "success";

  },

});
```

The first argument to the handler function is reserved for the action context.

### Action context[​](#action-context "Direct link to Action context")

The `action` constructor enables interacting with the database, and other Convex features by passing an [ActionCtx](/api/interfaces/server.GenericActionCtx.md) object to the handler function as the first argument:

convex/myFunctions.ts

```
import { action } from "./_generated/server";

import { v } from "convex/values";



export const doSomething = action({

  args: { a: v.number(), b: v.number() },

  handler: (ctx, args) => {

    // do something with `ctx`

  },

});
```

Which part of that action context is used depends on what your action needs to do:

* To read data from the database use the `runQuery` field, and call a query that performs the read:

  convex/myFunctions.ts

  ```
  import { action, internalQuery } from "./_generated/server";

  import { internal } from "./_generated/api";

  import { v } from "convex/values";



  export const doSomething = action({

    args: { a: v.number() },

    handler: async (ctx, args) => {

      const data = await ctx.runQuery(internal.myFunctions.readData, {

        a: args.a,

      });

      // do something with `data`

    },

  });



  export const readData = internalQuery({

    args: { a: v.number() },

    handler: async (ctx, args) => {

      // read from `ctx.db` here

    },

  });
  ```

  Here `readData` is an [internal query](/functions/internal-functions.md) because we don't want to expose it to the client directly. Actions, mutations and queries can be defined in the same file.

* To write data to the database use the `runMutation` field, and call a mutation that performs the write:

  convex/myFunctions.ts

  ```
  import { v } from "convex/values";

  import { action } from "./_generated/server";

  import { internal } from "./_generated/api";



  export const doSomething = action({

    args: { a: v.number() },

    handler: async (ctx, args) => {

      const data = await ctx.runMutation(internal.myMutations.writeData, {

        a: args.a,

      });

      // do something else, optionally use `data`

    },

  });
  ```

  Use an [internal mutation](/functions/internal-functions.md) when you want to prevent users from calling the mutation directly.

  As with queries, it's often convenient to define actions and mutations in the same file.

* To generate upload URLs for storing files use the `storage` field. Read on about [File Storage](/file-storage/overview.md).

* To check user authentication use the `auth` field. Auth is propagated automatically when calling queries and mutations from the action. Read on about [Authentication](/auth/overview.md).

* To schedule functions to run in the future, use the `scheduler` field. Read on about [Scheduled Functions](/scheduling/scheduled-functions.md).

* To search a vector index, use the `vectorSearch` field. Read on about [Vector Search](/search/vector-search.md).

### Dealing with circular type inference[​](#dealing-with-circular-type-inference "Direct link to Dealing with circular type inference")

Working around the TypeScript error: some action `implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.`

When the return value of an action depends on the result of calling `ctx.runQuery` or `ctx.runMutation`, TypeScript will complain that it cannot infer the return type of the action. This is a minimal example of the issue:

convex/myFunctions.ts

```
// TypeScript reports an error on `myAction`

export const myAction = action({

  args: {},

  handler: async (ctx) => {

    return await ctx.runQuery(api.myFunctions.getSomething);

  },

});



export const getSomething = query({

  args: {},

  handler: () => {

    return null;

  },

});
```

To work around this, there are two options:

1. Type the return value of the handler function explicitly:

   <!-- -->

   convex/myFunctions.ts

   ```
   export const myAction = action({

     args: {},

     handler: async (ctx): Promise<null> => {

       const result = await ctx.runQuery(api.myFunctions.getSomething);

       return result;

     },

   });
   ```

2. Type the the result of the `ctx.runQuery` or `ctx.runMutation` call explicitly:

   <!-- -->

   convex/myFunctions.ts

   ```
   export const myAction = action({

     args: {},

     handler: async (ctx) => {

       const result: null = await ctx.runQuery(api.myFunctions.getSomething);

       return result;

     },

   });
   ```

TypeScript will check that the type annotation matches what the called query or mutation returns, so you don't lose any type safety.

In this trivial example the return type of the query was `null`. See the [TypeScript](/understanding/best-practices/typescript.md#type-annotating-server-side-helpers) page for other types which might be helpful when annotating the result.

## Choosing the runtime ("use node")[​](#choosing-the-runtime-use-node "Direct link to Choosing the runtime (\"use node\")")

Actions can run in Convex's custom JavaScript environment or in Node.js.

By default, actions run in Convex's environment. This environment supports `fetch`, so actions that simply want to call a third-party API using `fetch` can be run in this environment:

convex/myFunctions.ts

```
import { action } from "./_generated/server";



export const doSomething = action({

  args: {},

  handler: async () => {

    const data = await fetch("https://api.thirdpartyservice.com");

    // do something with data

  },

});
```

Actions running in Convex's environment are faster compared to Node.js, since they don't require extra time to start up before running your action (cold starts). They can also be defined in the same file as other Convex functions. Like queries and mutations they can import NPM packages, but not all are supported.

Actions needing unsupported NPM packages or Node.js APIs can be configured to run in Node.js by adding the `"use node"` directive at the top of the file. Note that other Convex functions cannot be defined in files with the `"use node";` directive.

convex/myAction.ts

```
"use node";



import { action } from "./_generated/server";

import SomeNpmPackage from "some-npm-package";



export const doSomething = action({

  args: {},

  handler: () => {

    // do something with SomeNpmPackage

  },

});
```

Learn more about the two [Convex Runtimes](/functions/runtimes.md).

## Splitting up action code via helpers[​](#splitting-up-action-code-via-helpers "Direct link to Splitting up action code via helpers")

Just like with [queries](/functions/query-functions.md#splitting-up-query-code-via-helpers) and [mutations](/functions/mutation-functions.md#splitting-up-mutation-code-via-helpers) you can define and call helper functions to split up the code in your actions or reuse logic across multiple Convex functions.

But note that the [ActionCtx](/api/interfaces/server.GenericActionCtx.md) only has the `auth` field in common with [QueryCtx](/generated-api/server.md#queryctx) and [MutationCtx](/generated-api/server.md#mutationctx).

## Calling actions from clients[​](#calling-actions-from-clients "Direct link to Calling actions from clients")

To call an action from [React](/client/react/overview.md) use the [`useAction`](/api/modules/react.md#useaction) hook along with the generated [`api`](/generated-api/api.md) object.

src/myApp.tsx

```
import { useAction } from "convex/react";

import { api } from "../convex/_generated/api";



export function MyApp() {

  const performMyAction = useAction(api.myFunctions.doSomething);

  const handleClick = () => {

    performMyAction({ a: 1 });

  };

  // pass `handleClick` to a button

  // ...

}
```

Unlike [mutations](/functions/mutation-functions.md#calling-mutations-from-clients), actions from a single client are parallelized. Each action will be executed as soon as it reaches the server (even if other actions and mutations from the same client are running). If your app relies on actions running after other actions or mutations, make sure to only trigger the action after the relevant previous function completes.

**Note:** In most cases calling an action directly from a client **is an anti-pattern**. Instead, have the client call a [mutation](/functions/mutation-functions.md) which captures the user intent by writing into the database and then [schedules](/scheduling/scheduled-functions.md) an action:

convex/myFunctions.ts

```
import { v } from "convex/values";

import { internal } from "./_generated/api";

import { internalAction, mutation } from "./_generated/server";



export const mutationThatSchedulesAction = mutation({

  args: { text: v.string() },

  handler: async (ctx, { text }) => {

    const taskId = await ctx.db.insert("tasks", { text });

    await ctx.scheduler.runAfter(0, internal.myFunctions.actionThatCallsAPI, {

      taskId,

      text,

    });

  },

});



export const actionThatCallsAPI = internalAction({

  args: { taskId: v.id("tasks"), text: v.string() },

  handler: (_, args): void => {

    // do something with `taskId` and `text`, like call an API

    // then run another mutation to store the result

  },

});
```

This way the mutation can enforce invariants, such as preventing the user from executing the same action twice.

## Limits[​](#limits "Direct link to Limits")

Actions time out after 10 minutes. [Node.js](/functions/runtimes.md#nodejs-runtime) and [Convex runtime](/functions/runtimes.md#default-convex-runtime) have 512MB and 64MB memory limit respectively. Please [contact us](/production/contact.md) if you have a use case that requires configuring higher limits.

Actions can do up to 1000 concurrent operations, such as executing queries, mutations or performing fetch requests.

For information on other limits, see [here](/production/state/limits.md).

If you need to allowlist Convex's outbound IP addresses in an external service's firewall, see [Networking](/production/networking.md).

## Error handling[​](#error-handling "Direct link to Error handling")

Unlike queries and mutations, actions may have side-effects and therefore can't be automatically retried by Convex when errors occur. For example, say your action calls Stripe to send a customer invoice. If the HTTP request fails, Convex has no way of knowing if the invoice was already sent. Like in normal backend code, it is the responsibility of the caller to handle errors raised by actions and retry the action call if appropriate.

## Dangling promises[​](#dangling-promises "Direct link to Dangling promises")

Make sure to await all promises created within an action. Async tasks still running when the function returns might or might not complete. In addition, since the Node.js execution environment might be reused between action calls, dangling promises might result in errors in subsequent action invocations.

## Best practices[​](#best-practices "Direct link to Best practices")

### `await ctx.runAction` should only be used for crossing JS runtimes[​](#await-ctxrunaction-should-only-be-used-for-crossing-js-runtimes "Direct link to await-ctxrunaction-should-only-be-used-for-crossing-js-runtimes")

**Why?** `await ctx.runAction` incurs the overhead of another Convex server function. It counts as an extra function call, it allocates its own system resources, and while you're awaiting this call the parent action call is frozen holding all its resources. If you pile enough of these calls on top of each other, your app may slow down significantly.

**Fix:** The reason this API exists is to let you run code in the [Node.js environment](/functions/runtimes.md). If you want to call an action from another action that's in the same runtime, which is the normal case, the best way to do this is to pull the code you want to call into a TypeScript [helper function](/understanding/best-practices/.md#use-helper-functions-to-write-shared-code) and call the helper instead.

### Avoid `await ctx.runMutation` / `await ctx.runQuery`[​](#avoid-await-ctxrunmutation--await-ctxrunquery "Direct link to avoid-await-ctxrunmutation--await-ctxrunquery")

```
// ❌

const foo = await ctx.runQuery(...)

const bar = await ctx.runQuery(...)



// ✅

const fooAndBar = await ctx.runQuery(...)
```

**Why?** Multiple runQuery / runMutations execute in separate transactions and aren’t guaranteed to be consistent with each other (e.g. foo and bar could read the same document and return two different results), while a single runQuery / runMutation will always be consistent. Additionally, you’re paying for multiple function calls when you don’t have to.

**Fix:** Make a new internal query / mutation that does both things. Refactoring the code for the two functions into helpers will make it easy to create a new internal function that does both things while still keeping around the original functions. Potentially try and refactor your action code to “batch” all the database access.

Caveats: Separate runQuery / runMutation calls are valid when intentionally trying to process more data than fits in a single transaction (e.g. running a migration, doing a live aggregate).

## Related Components[​](#related-components "Direct link to Related Components")

[Convex Component](https://www.convex.dev/components/action-cache)

### [Action Cache](https://www.convex.dev/components/action-cache)

[Cache expensive or frequently run actions. Allows configurable cache duration and forcing updates.](https://www.convex.dev/components/action-cache)

[Convex Component](https://www.convex.dev/components/workpool)

### [Workpool](https://www.convex.dev/components/workpool)

[Workpool give critical tasks priority by organizing async operations into separate, customizable queues. Supports retries and parallelism limits.](https://www.convex.dev/components/workpool)

[Convex Component](https://www.convex.dev/components/workflow)

### [Workflow](https://www.convex.dev/components/workflow)

[Similar to Actions, Workflows can call queries, mutations, and actions. However, they are durable functions that can suspend, survive server crashes, specify retries for action calls, and more.](https://www.convex.dev/components/workflow)


---

<!-- Source: https://docs.convex.dev/functions/internal-functions -->
Source: https://docs.convex.dev/functions/internal-functions

# Internal Functions

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Internal functions can only be called by other [functions](/functions/overview.md) and cannot be called directly from a [Convex client](/client/react/overview.md).

By default your Convex functions are public and accessible to clients. Public functions may be called by malicious users in ways that cause surprising results. Internal functions help you mitigate this risk. We recommend using internal functions any time you're writing logic that should not be called from a client.

While internal functions help mitigate risk by reducing the public surface area of your application, you can still validate internal invariants using [argument validation](/functions/validation.md) and/or [authentication](/auth/functions-auth.md).

## Use cases for internal functions[​](#use-cases-for-internal-functions "Direct link to Use cases for internal functions")

Leverage internal functions by:

* Calling them from [actions](/functions/actions.md#action-context) via `runQuery` and `runMutation`
* Calling them from [HTTP actions](/functions/http-actions.md) via `runQuery`, `runMutation`, and `runAction`
* [Scheduling](/scheduling/scheduled-functions.md) them from other functions to run in the future
* Scheduling them to run periodically from [cron jobs](/scheduling/cron-jobs.md)
* Running them using the [Dashboard](/dashboard/deployments/functions.md#running-functions)
* Running them from the [CLI](/cli/reference/run.md)

## Defining internal functions[​](#defining-internal-functions "Direct link to Defining internal functions")

An internal function is defined using `internalQuery`, `internalMutation`, or `internalAction`. For example:

convex/plans.ts

```
import { internalMutation } from "./_generated/server";

import { v } from "convex/values";



export const markPlanAsProfessional = internalMutation({

  args: { planId: v.id("plans") },

  handler: async (ctx, args) => {

    await ctx.db.patch("plans", args.planId, { planType: "professional" });

  },

});
```

If you need to pass complicated objects to internal functions you might prefer to not use argument validation. Note though that if you're using `internalQuery` or `internalMutation` it's a better idea to pass around document IDs instead of documents, to ensure the query or mutation is working with the up-to-date state of the database.

Internal function without argument validation

convex/plans.ts

```
import { internalAction } from "./_generated/server";

import { Doc } from "./_generated/dataModel";



export const markPlanAsProfessional = internalAction({

  handler: async (actionCtx, args) => {

    // perform an action, perhaps calling a third-party API

  },

});
```

## Calling internal functions[​](#calling-internal-functions "Direct link to Calling internal functions")

Internal functions can be called from actions and scheduled from actions and mutation using the [`internal`](/generated-api/api.md#internal) object.

For example, consider this public `upgrade` action that calls the internal `plans.markPlanAsProfessional` mutation we defined above:

convex/changes.ts

```
import { action } from "./_generated/server";

import { internal } from "./_generated/api";

import { v } from "convex/values";



export const upgrade = action({

  args: {

    planId: v.id("plans"),

  },

  handler: async (ctx, args) => {

    // Call out to payment provider (e.g. Stripe) to charge customer

    const response = await fetch("https://...");

    if (response.ok) {

      // Mark the plan as "professional" in the Convex DB

      await ctx.runMutation(internal.plans.markPlanAsProfessional, {

        planId: args.planId,

      });

    }

  },

});
```

In this example a user should not be able to directly call `internal.plans.markPlanAsProfessional` without going through the `upgrade` action — if they did, then they would get a free upgrade.

You can define public and internal functions in the same file.


---

<!-- Source: https://docs.convex.dev/functions/validation -->
Source: https://docs.convex.dev/functions/validation

# Argument and Return Value Validation

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Argument and return value validators ensure that [queries](/functions/query-functions.md), [mutations](/functions/mutation-functions.md), and [actions](/functions/actions.md) are called with the correct types of arguments and return the expected types of return values.

**This is important for security!** Without argument validation, a malicious user can call your public functions with unexpected arguments and cause surprising results. [TypeScript](/understanding/best-practices/typescript.md) alone won't help because TypeScript types aren't present at runtime. We recommend adding argument validation for all public functions in production apps. For non-public functions that are not called by clients, we recommend [internal functions](/functions/internal-functions.md) and optionally validation.

**Example:** [Argument Validation](https://github.com/convex/convex-demos/tree/main/args-validation)

## Adding validators[​](#adding-validators "Direct link to Adding validators")

To add argument validation to your functions, pass an object with `args` and `handler` properties to the `query`, `mutation` or `action` constructor. To add return value validation, use the `returns` property in this object:

convex/message.ts

```
import { mutation, query } from "./_generated/server";

import { v } from "convex/values";



export const send = mutation({

  args: {

    body: v.string(),

    author: v.string(),

  },

  returns: v.null(),

  handler: async (ctx, args) => {

    const { body, author } = args;

    await ctx.db.insert("messages", { body, author });

  },

});
```

If you define your function with an argument validator, there is no need to include [TypeScript](/understanding/best-practices/typescript.md) type annotations! The type of your function will be inferred automatically. Similarly, if you define a return value validator, the return type of your function will be inferred from the validator, and TypeScript will check that it matches the inferred return type of the `handler` function.

Unlike TypeScript, validation for an object will throw if the object contains properties that are not declared in the validator.

If the client supplies arguments not declared in `args`, or if the function returns a value that does not match the validator declared in `returns`. This is helpful to prevent bugs caused by mistyped names of arguments or returning more data than intended to a client.

Even `args: {}` is a helpful use of validators because TypeScript will show an error on the client if you try to pass any arguments to the function which doesn't expect them.

## Supported types[​](#supported-types "Direct link to Supported types")

All functions, both public and internal, can accept and return the following data types. Each type has a corresponding validator that can be accessed on the [`v`](/api/modules/values.md#v) object imported from `"convex/values"`.

The [database](/database/overview.md) can store the exact same set of [data types](/database/types.md).

Additionally you can also express type unions, literals, `any` types, and optional fields.

### Convex values[​](#convex-values "Direct link to Convex values")

Convex supports the following types of values:

| Convex Type | TS/JS Type                                                                                                                      | Example Usage          | Validator for [Argument Validation](/functions/validation.md) and [Schemas](/database/schemas.md) | `json` Format for [Export](/database/import-export/.md) | Notes                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Id          | [Id](/database/document-ids.md) ([string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)) | `doc._id`              | `v.id(tableName)`                                                                                 | string                                                  | See [Document IDs](/database/document-ids.md).                                                                                                                                                                                                                                                                                                         |
| Null        | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#null_type)                                       | `null`                 | `v.null()`                                                                                        | null                                                    | JavaScript's `undefined` is not a valid Convex value. Functions the return `undefined` or do not return will return `null` when called from a client. Use `null` instead.                                                                                                                                                                              |
| Int64       | [bigint](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type)                                   | `3n`                   | `v.int64()`                                                                                       | string (base10)                                         | Int64s only support BigInts between -2^63 and 2^63-1. Convex supports `bigint`s in [most modern browsers](https://caniuse.com/bigint).                                                                                                                                                                                                                 |
| Float64     | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type)                                   | `3.1`                  | `v.number()`                                                                                      | number / string                                         | Convex supports all IEEE-754 double-precision floating point numbers (such as NaNs). Inf and NaN are JSON serialized as strings.                                                                                                                                                                                                                       |
| Boolean     | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#boolean_type)                                 | `true`                 | `v.boolean()`                                                                                     | bool                                                    |                                                                                                                                                                                                                                                                                                                                                        |
| String      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)                                   | `"abc"`                | `v.string()`                                                                                      | string                                                  | Strings are stored as UTF-8 and must be valid Unicode sequences. Strings must be smaller than the 1MB total size limit when encoded as UTF-8.                                                                                                                                                                                                          |
| Bytes       | [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)                     | `new ArrayBuffer(8)`   | `v.bytes()`                                                                                       | string (base64)                                         | Convex supports first class bytestrings, passed in as `ArrayBuffer`s. Bytestrings must be smaller than the 1MB total size limit for Convex types.                                                                                                                                                                                                      |
| CommitTs    | [bigint](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) or `CommitTsPlaceholder`          | `db.vars.commitTs`     | `v.commitTs()`                                                                                    | string (base10)                                         | Either an Int64 commit timestamp or a placeholder. See [Commit Timestamp](/database/advanced/commit-timestamp.md).                                                                                                                                                                                                                                     |
| Array       | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)                                 | `[1, 3.2, "abc"]`      | `v.array(values)`                                                                                 | array                                                   | Arrays can have at most 8192 values.                                                                                                                                                                                                                                                                                                                   |
| Object      | [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#objects)                                       | `{a: "abc"}`           | `v.object({property: value})`                                                                     | object                                                  | Convex only supports "plain old JavaScript objects" (objects that do not have a custom prototype). Convex includes all [enumerable properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). Objects can have at most 1024 entries. Field names must be nonempty and not start with "$" or "\_". |
| Record      | [Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)                                       | `{"a": "1", "b": "2"}` | `v.record(keys, values)`                                                                          | object                                                  | Records are objects at runtime, but can have dynamic keys. Keys must be only ASCII characters, nonempty, and not start with "$" or "\_".                                                                                                                                                                                                               |

### Unions[​](#unions "Direct link to Unions")

You can describe fields that could be one of multiple types using `v.union`:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    stringOrNull: v.union(v.string(), v.null()),

  },

  handler: async (ctx, { stringOrNull }) => {

    //...

  },

});
```

For convenience, `v.nullable(foo)` is equivalent to `v.union(foo, v.null())`.

### Literals[​](#literals "Direct link to Literals")

Fields that are a constant can be expressed with `v.literal`. This is especially useful when combined with unions:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    oneTwoOrThree: v.union(

      v.literal("one"),

      v.literal("two"),

      v.literal("three"),

    ),

  },

  handler: async (ctx, { oneTwoOrThree }) => {

    //...

  },

});
```

### Record objects[​](#record-objects "Direct link to Record objects")

You can describe objects that map arbitrary keys to values with `v.record`:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    simpleMapping: v.record(v.string(), v.boolean()),

  },

  handler: async (ctx, { simpleMapping }) => {

    //...

  },

});
```

You can use other types of string validators for the keys:

```
defineTable({

  userIdToValue: v.record(v.id("users"), v.boolean()),

});
```

Notes:

* This type corresponds to the [Record\<K,V>](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type) type in TypeScript.
* You cannot use string literals as a `record` key.
* Using `v.string()` as a `record` key validator will only allow ASCII characters.

### Any[​](#any "Direct link to Any")

Fields that could take on any value can be represented with `v.any()`:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    anyValue: v.any(),

  },

  handler: async (ctx, { anyValue }) => {

    //...

  },

});
```

This corresponds to the `any` type in TypeScript.

### Optional fields[​](#optional-fields "Direct link to Optional fields")

You can describe optional fields by wrapping their type with `v.optional(...)`:

```
import { mutation } from "./_generated/server";

import { v } from "convex/values";



export default mutation({

  args: {

    optionalString: v.optional(v.string()),

    optionalNumber: v.optional(v.number()),

  },

  handler: async (ctx, { optionalString, optionalNumber }) => {

    //...

  },

});
```

This corresponds to marking fields as optional with `?` in TypeScript.

## Extracting TypeScript types[​](#extracting-typescript-types "Direct link to Extracting TypeScript types")

The [`Infer`](/api/modules/values.md#infer) type allows you to turn validator calls into TypeScript types. This can be useful to remove duplication between your validators and TypeScript types:

```
import { mutation } from "./_generated/server";

import { Infer, v } from "convex/values";



const nestedObject = v.object({

  property: v.string(),

});



// Resolves to `{property: string}`.

export type NestedObject = Infer<typeof nestedObject>;



export default mutation({

  args: {

    nested: nestedObject,

  },

  handler: async (ctx, { nested }) => {

    //...

  },

});
```

### Reusing and extending validators[​](#reusing-and-extending-validators "Direct link to Reusing and extending validators")

Validators can be defined once and shared between functions and table schemas.

```
const statusValidator = v.union(v.literal("active"), v.literal("inactive"));



const userValidator = v.object({

  name: v.string(),

  email: v.email(),

  status: statusValidator,

  profileUrl: v.optional(v.string()),

});



const schema = defineSchema({

  users: defineTable(userValidator).index("by_email", ["email"]),

});
```

You can create new object validators from existing ones by adding or removing fields using `.pick`, `.omit`, `.extend`, and `.partial` on object validators.

```
// Creates a new validator with only the name and profileUrl fields.

const publicUser = userValidator.pick("name", "profileUrl");



// Creates a new validator with all fields except the specified fields.

const userWithoutStatus = userValidator.omit("status", "profileUrl");



// Creates a validator where all fields are optional.

// This is useful for validating patches to a document.

const userPatch = userWithoutStatus.partial();



// Creates a new validator with an extra field added.

const userWithFriends = userValidator.extend({

  friends: v.array(schema.id("users")),

});
```

To validate whole documents of a table, use `schema.doc(tableName)`, which is that table's validator with the `_id` and `_creationTime` system fields added. `schema.id(tableName)` is `v.id(tableName)` restricted to the table names in your schema, for a type-safe alternative to `v.id`.

```
export const getUserById = query({

  args: { id: schema.id("users") },

  returns: v.union(schema.doc("users"), v.null()),

  handler: async (ctx, { id }) => {

    return await ctx.db.get("users", id);

  },

});
```

For a table defined with a union, `schema.doc` adds the system fields to each member of the union.

Notes:

* Object validators don't allow extra properties, objects with properties that aren't specified will fail validation.
* Top-level table fields cannot start with `_` because they are reserved for system fields like `_id` and `_creationTime`.


---

<!-- Source: https://docs.convex.dev/functions/runtimes -->
Source: https://docs.convex.dev/functions/runtimes

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# Runtimes

Convex functions can run in two runtimes:

* Default [Convex runtime](#default-convex-runtime)
* Opt-in [Node.js runtime](#nodejs-runtime)

## Default Convex runtime[​](#default-convex-runtime "Direct link to Default Convex runtime")

All Convex backend functions are written in JavaScript or TypeScript. By default all functions run in a custom JavaScript runtime very similar to the [Cloudflare Workers runtime](https://blog.cloudflare.com/cloud-computing-without-containers/) with access to most [web standard globals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).

The default runtime has many advantages including:

* **No cold starts**. The runtime is always up, and ready to handle any function at a moments notice.
* **Latest web JavaScript standards**. The runtime is based on V8 that also powers Google Chrome. This ensures it provides an interface very similar to your frontend code, allowing further simplification to your code.
* **Low overhead access to your data**. The runtime is designed to have low overhead access to your data via query & mutation functions, allowing you to access your database via a simple [JavaScript interface](/database/reading-data/.md).

### Supported APIs[​](#supported-apis "Direct link to Supported APIs")

The default runtime supports most npm libraries that work in the browser, [Deno](https://deno.com/), and [Cloudflare workers](https://developers.cloudflare.com/workers/). If your library isn't supported, you can use an action with the [Node.js runtime](#nodejs-runtime), or reach out in [Discord](https://convex.dev/community). We are improving support all the time.

#### Network APIs[​](#network-apis "Direct link to Network APIs")

* [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
* [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event)
* [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
* [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) — in [Actions](#actions) only. See [Networking](/production/networking.md) for egress IP addresses.
* [File](https://developer.mozilla.org/en-US/docs/Web/API/File)
* [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
* [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)
* [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
* [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

#### Encoding APIs[​](#encoding-apis "Direct link to Encoding APIs")

* [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)
* [TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder)
* [atob](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/atob)
* [btoa](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/btoa)

#### Web Stream APIs[​](#web-stream-apis "Direct link to Web Stream APIs")

* [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
* [ReadableStreamBYOBReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamBYOBReader)
* [ReadableStreamDefaultReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader)
* [TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)
* [WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)
* [WritableStreamDefaultWriter](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter)

#### Web Crypto APIs[​](#web-crypto-apis "Direct link to Web Crypto APIs")

* [crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
* [CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
* [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

#### Timing APIs[​](#timing-apis "Direct link to Timing APIs")

* [`performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
* [Performance](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
* [PerformanceEntry](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry)
* [PerformanceMark](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceMark)
* [PerformanceMeasure](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceMeasure)

warning

Note that there are additional [restrictions](#using-randomness-and-time-in-queries-and-mutations) on the Performance API when used in queries.

#### Node APIs[​](#node-apis "Direct link to Node APIs")

A few Node.js APIs are available in the default runtime. If you need more than these, see the [Node.js runtime](#nodejs-runtime).

If you are using TypeScript, you may need to add a dev dependency on `@types/node` to access these APIs. For TypeScript 6+ you'll also need to add `"types": ["node"]` to your `convex/tsconfig.json` file (if not already present).

* [process.env](https://nodejs.org/api/process.html#processenv) (see the [Environment variables](/production/environment-variables.md) docs)
* [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
* [AsyncResource](https://nodejs.org/api/async_context.html#class-asyncresource)

note

Data in `AsyncLocalStorage` does not propagate into calls to `ctx.runMutation`, `ctx.runQuery` or `ctx.runAction`. If you want values to propagate into those calls, you'll need to manually pass them as arguments.

### Running WebAssembly[​](#running-webassembly "Direct link to Running WebAssembly")

The default Convex runtime supports the [WebAssembly API](https://developer.mozilla.org/en-US/docs/WebAssembly), including [`WebAssembly.instantiate`](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiate_static), [`WebAssembly.Module`](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Module), and [`WebAssembly.Instance`](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Instance). WebAssembly can run in all kinds of Convex functions. The compiled WebAssembly module counts toward the [bundle size limit](/functions/bundling.md#code-size-limits) for your `convex/` directory.

You can instantiate a module from bytes at runtime, but the simplest way to get a module is to import a `.wasm` file directly. The bundler compiles it and gives you a [`WebAssembly.Module`](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Module) as the default export:

```
import wasmModule from "./add.wasm"; // a compiled WebAssembly.Module



const instance = await WebAssembly.instantiate(wasmModule, {});

const add = instance.exports.add as (a: number, b: number) => number;

add(1, 2); // 3
```

To import WebAssembly files from TypeScript, you will need to add an ambient declaration so the import typechecks:

```
// convex/wasm.d.ts

declare module "*.wasm" {

  const mod: WebAssembly.Module;

  export default mod;

}
```

### Restrictions on queries and mutations[​](#restrictions-on-queries-and-mutations "Direct link to Restrictions on queries and mutations")

Query and mutation functions are further **restricted by the runtime to be [deterministic](https://en.wikipedia.org/wiki/Deterministic_algorithm)**. This allows Convex to automatically retry them by the system as necessary.

Determinism means that no matter how many times your function is run, as long as it is given the same arguments, it will have identical side effects and return the same value.

You don't have to think all that much about maintaining these properties of determinism when you write your Convex functions. Convex will provide helpful error messages as you go, so you can't *accidentally* do something forbidden.

#### Using randomness and time in queries and mutations[​](#using-randomness-and-time-in-queries-and-mutations "Direct link to Using randomness and time in queries and mutations")

Convex provides a "seeded" strong pseudo-random number generator at `Math.random()` so that it can guarantee the determinism of your function. The random number generator's seed is an implicit parameter to your function. Multiple calls to `Math.random()` in one function call will return different random values. However, a call to `Math.random()` stored in a global variable will not change between function runs, because during import-time, the random number generator's seed is fixed to a value set at the most recent deployment.

To ensure the logic within your function is reproducible, the system time used globally (outside of any function) is "frozen" at deploy time, while the system time during Convex function execution is "frozen" when the function begins. `Date.now()` will return the same result for the entirety of your function's execution. For example,

```
const globalRand = Math.random(); // `globalRand` does not change between runs.

const globalNow = Date.now(); // `globalNow` is the time when Convex functions were deployed.



export const updateSomething = mutation({

  args: {},

  handler: () => {

    const now1 = Date.now(); // `now1` is the time when the function execution started.

    const rand1 = Math.random(); // `rand1` has a new value for each function run.

    // implementation

    const now2 = Date.now(); // `now2` === `now1`

    const rand2 = Math.random(); // `rand1` !== `rand2`

  },

});
```

Likewise, `performance.now()` is fixed to same result during query function execution. However, `performance.now()` will increment inside mutations. [`Performance.timeOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/timeOrigin) is fixed to the deploy timestamp, both globally and during execution for all functions (except for in the [Node.js runtime](#nodejs-runtime)).

### Actions[​](#actions "Direct link to Actions")

Actions are unrestricted by the same rules of determinism as query and mutation functions. Notably actions are allowed to call third-party HTTP endpoints via the browser-standard [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) function.

By default actions also run in Convex’s custom JavaScript runtime with all of its advantages including no cold starts and a browser-like API environment. They can also live in the same file as your query and mutation functions.

## Node.js runtime[​](#nodejs-runtime "Direct link to Node.js runtime")

Some JavaScript and TypeScript libraries use features that are not included in the default Convex runtime. Convex actions provide an escape hatch to [Node.js](https://nodejs.org/en/about) via the `"use node"` directive at the top of a file that contains your action. [Learn more](/functions/actions.md#choosing-the-runtime-use-node).

Use of the Node.js environment is restricted to **action functions only**. If you want to use a library designed for Node.js and interact with the Convex database, you need to call the Node.js library from an action, and use [`runQuery`](/functions/actions.md#action-context) or [`runMutation`](/functions/actions.md#action-context) helper to call a query or mutation.

Every `.ts` and `.js` file in the convex directory [is bundled](/functions/bundling.md) either for the default Convex JavaScript runtime or Node.js, along with any code it imports.

Files with the `"use node"` directive should not contain any Convex queries or mutations since they cannot be run in the Node.js runtime. Additionally, files without the `"use node"` directive should not import any files with the `"use node"` directive. Files that contain no Convex functions, like a `convex/utils.ts` file, also need the "use node" directive if they use Node.js-specific libraries.

If you encounter bundling errors about Node.js-specific imports like `fs` / `node:fs` not being available when deploying convex functions, running `npx convex dev --once --debug-node-apis` gives more information about these. It uses a slower bundling method to track the train of imports, narrowing down which import is responsible for the error.

Note that argument size limits are lower (5MiB instead of 16MiB).

### Node.js version configuration[​](#nodejs-version-configuration "Direct link to Node.js version configuration")

By default, all actions ran in the Node.js environment are executed in Node.js 24. This version is configurable in the [convex.json](/config/convex.json.md#configuring-the-nodejs-version) file. We currently support Node.js 22 and 24.

When pushing a new Node.js version to the server, the new code for your functions may be executed in the old Node.js version for up a few minutes.

Note: This configuration is not supported when running the self-hosted Convex backend. The node version that is specified in the [.nvmrc](https://github.com/convex/convex-backend/blob/main/.nvmrc) will be used instead.


---

<!-- Source: https://docs.convex.dev/functions/http-actions -->
Source: https://docs.convex.dev/functions/http-actions

# HTTP Actions

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

HTTP actions allow you to build an HTTP API right in Convex!

convex/http.ts

```
import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";



const http = httpRouter();



http.route({

  path: "/",

  method: "GET",

  handler: httpAction(async (ctx, request) => {

    return new Response(`Hello from ${request.url}`);

  }),

});

export default http;
```

HTTP actions take in a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and return a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) following the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). HTTP actions can manipulate the request and response directly, and interact with data in Convex indirectly by running [queries](/functions/query-functions.md), [mutations](/functions/mutation-functions.md), and [actions](/functions/actions.md). HTTP actions might be used for receiving webhooks from external applications or defining a public HTTP API.

HTTP actions are exposed at `https://<your deployment name>.convex.site` (e.g. `https://happy-animal-123.convex.site`).

**Example:** [HTTP Actions](https://github.com/convex/convex-demos/tree/main/http)

## Defining HTTP actions[​](#defining-http-actions "Direct link to Defining HTTP actions")

HTTP action handlers are defined using the [`httpAction`](/generated-api/server.md#httpaction) constructor, similar to the `action` constructor for normal actions:

convex/myHttpActions.ts

```
import { httpAction } from "./_generated/server";



export const doSomething = httpAction(async () => {

  // implementation will be here

  return new Response();

});
```

The first argument to the `handler` is an [`ActionCtx`](/api/interfaces/server.GenericActionCtx.md) object, which provides [`auth`](/api/interfaces/server.Auth.md), [`storage`](/api/interfaces/server.StorageActionWriter.md), and [`scheduler`](/api/interfaces/server.Scheduler.md), as well as `runQuery`, `runMutation`, `runAction`.

The second argument contains the [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) data. HTTP actions do not support argument validation, as the parsing of arguments from the incoming Request is left entirely to you.

Here's an example:

convex/messages.ts

```
import { httpAction } from "./_generated/server";

import { internal } from "./_generated/api";



export const postMessage = httpAction(async (ctx, request) => {

  const { author, body } = await request.json();



  await ctx.runMutation(internal.messages.sendOne, {

    body: `Sent via HTTP action: ${body}`,

    author,

  });



  return new Response(null, {

    status: 200,

  });

});
```

To expose the HTTP Action, export an instance of [`HttpRouter`](/api/classes/server.HttpRouter.md) from the `convex/http.ts` file. To create the instance call the `httpRouter` function. On the `HttpRouter` you can expose routes using the `route` method:

convex/http.ts

```
import { httpRouter } from "convex/server";

import { postMessage, getByAuthor, getByAuthorPathSuffix } from "./messages";



const http = httpRouter();



http.route({

  path: "/postMessage",

  method: "POST",

  handler: postMessage,

});



// Define additional routes

http.route({

  path: "/getMessagesByAuthor",

  method: "GET",

  handler: getByAuthor,

});



// Define a route using a path prefix

http.route({

  // Will match /getAuthorMessages/User+123 and /getAuthorMessages/User+234 etc.

  pathPrefix: "/getAuthorMessages/",

  method: "GET",

  handler: getByAuthorPathSuffix,

});



// Convex expects the router to be the default export of `convex/http.js`.

export default http;
```

You can now call this action via HTTP and interact with data stored in the Convex Database. HTTP actions are exposed on `https://<your deployment name>.convex.site`.

```
export DEPLOYMENT_NAME=... # example: "happy-animal-123"

curl -d '{ "author": "User 123", "body": "Hello world" }' \

    -H 'content-type: application/json' "https://$DEPLOYMENT_NAME.convex.site/postMessage"
```

Like other Convex functions, you can view your HTTP actions in the [Functions view](/dashboard/deployments/functions.md) of [your dashboard](https://dashboard.convex.dev/) and view logs produced by them in the [Logs view](/dashboard/deployments/logs.md).

## Routing with `httpPrefix`[​](#routing-with-httpprefix "Direct link to routing-with-httpprefix")

By default, all routes defined in `convex/http.ts` are served at the root of your deployment's `.convex.site` domain. You can use the `httpPrefix` option in `convex/convex.config.ts` to namespace your app's routes under a path prefix:

convex/convex.config.ts

```
import { defineApp } from "convex/server";



const app = defineApp({ httpPrefix: "/app/" });

export default app;
```

With this configuration, a route defined for `/hello` in `convex/http.ts` will be accessible at `/app/hello`.

[Components](/components/overview.md) can also define their own HTTP routes that are mounted under a prefix you choose. See [Using Components: HTTP Routes](/components/using.md#http-routes) for details.

## Limits[​](#limits "Direct link to Limits")

HTTP actions run in the same environment as queries and mutations so also do not have access to Node.js-specific JavaScript APIs. HTTP actions can call [actions](/functions/actions.md), which can run in Node.js.

Like [actions](/functions/actions.md#error-handling), HTTP actions may have side-effects and will not be automatically retried by Convex when errors occur. It is a responsibility of the caller to handle errors and retry the request if appropriate.

There is no specific limit on request size, except `multipart/form-data` bodies, which are limited to 20 MiB. Response size is limited to 100 MiB. HTTP actions in the Convex runtime have 64 MiB of memory, so to return a response larger than that, stream the body with a `ReadableStream` instead of building it in memory.

HTTP actions support request and response body types of `.text()`, `.json()`, `.blob()`, and `.arrayBuffer()`.

Note that you don't need to define an HTTP action to call your queries, mutations and actions over HTTP if you control the caller, since you can use use the JavaScript [`ConvexHttpClient`](/api/classes/browser.ConvexHttpClient.md) or the [Python client](/client/python.md) to call these functions directly.

## Debugging[​](#debugging "Direct link to Debugging")

### Step 1: Check that your HTTP actions were deployed.[​](#step-1-check-that-your-http-actions-were-deployed "Direct link to Step 1: Check that your HTTP actions were deployed.")

Check the [functions page](https://dashboard.convex.dev/deployment/functions) in the dashboard and make sure there's an entry called `http`.

If not, double check that you've defined your HTTP actions with the `httpRouter` in a file called `http.js` or `http.ts` (the name of the file must match exactly), and that `npx convex dev` has no errors.

### Step 2: Check that you can access your endpoint using curl[​](#step-2-check-that-you-can-access-your-endpoint-using-curl "Direct link to Step 2: Check that you can access your endpoint using curl")

Get your URL from the dashboard under [Settings](https://dashboard.convex.dev/deployment/settings) > URL and Deploy Key.

Make sure this is the URL that ends in **`.convex.site`**, and not `.convex.cloud`. E.g. `https://happy-animal-123.convex.site`

Run a `curl` command to hit one of your defined endpoints, potentially defining a new endpoint specifically for testing

```
curl -X GET https://<deployment name>.convex.site/myEndpoint
```

Check the [logs page](https://dashboard.convex.dev/deployment/logs) in the dashboard to confirm that there's an entry for your HTTP action.

### Step 3: Check the request being made by your browser[​](#step-3-check-the-request-being-made-by-your-browser "Direct link to Step 3: Check the request being made by your browser")

If you've determined that your HTTP actions have been deployed and are accessible via curl, but there are still issues requesting them from your app, check the exact requests being made by your browser.

Open the *Network* tab in your browser's developer tools, and trigger your HTTP requests.

Check that this URL matches what you tested earlier with curl -- it ends in `.convex.site` and has the right deployment name.

You should be able to see these requests in the dashboard [logs page](https://dashboard.convex.dev/deployment/logs).

If you see "CORS error" or messages in the browser console like `Access to fetch at '...' from origin '...' has been blocked by CORS policy`, you likely need to configure CORS headers and potentially add a handler for the pre-flight `OPTIONS` request. See [this section](/functions/http-actions.md#cors) below.

## Common patterns[​](#common-patterns "Direct link to Common patterns")

### File Storage[​](#file-storage "Direct link to File Storage")

HTTP actions can be used to handle uploading and fetching stored files, see:

* [Uploading files via an HTTP action](/file-storage/upload-files.md#uploading-files-via-an-http-action)
* [Serving files from HTTP actions](/file-storage/serve-files.md#serving-files-from-http-actions)

### CORS[​](#cors "Direct link to CORS")

To make requests to HTTP actions from a website you need to add [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers to your HTTP actions.

There are existing resources for exactly which CORS headers are required based on the use case. [This site](https://httptoolkit.com/will-it-cors/) provides an interactive walkthrough for what CORS headers to add. Here's an example of adding CORS headers to a Convex HTTP action:

convex/http.ts

```
import { httpRouter } from "convex/server";

import { env, httpAction } from "./_generated/server";

import { api } from "./_generated/api";

import { Id } from "./_generated/dataModel";



const http = httpRouter();



http.route({

  path: "/sendImage",

  method: "POST",

  handler: httpAction(async (ctx, request) => {

    // Step 1: Store the file

    const blob = await request.blob();

    const storageId = await ctx.storage.store(blob);



    // Step 2: Save the storage ID to the database via a mutation

    const author = new URL(request.url).searchParams.get("author");

    if (author === null) {

      return new Response("Author is required", {

        status: 400,

      });

    }



    await ctx.runMutation(api.messages.sendImage, { storageId, author });



    // Step 3: Return a response with the correct CORS headers

    return new Response(null, {

      status: 200,

      // CORS headers

      headers: new Headers({

        // e.g. https://mywebsite.com, configured on your Convex dashboard

        "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,

        Vary: "origin",

      }),

    });

  }),

});
```

Here's an example of handling a pre-flight `OPTIONS` request:

convex/http.ts

```
// Pre-flight request for /sendImage

http.route({

  path: "/sendImage",

  method: "OPTIONS",

  handler: httpAction(async (_, request) => {

    // Make sure the necessary headers are present

    // for this to be a valid pre-flight request

    const headers = request.headers;

    if (

      headers.get("Origin") !== null &&

      headers.get("Access-Control-Request-Method") !== null &&

      headers.get("Access-Control-Request-Headers") !== null

    ) {

      return new Response(null, {

        headers: new Headers({

          // e.g. https://mywebsite.com, configured on your Convex dashboard

          "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,

          "Access-Control-Allow-Methods": "POST",

          "Access-Control-Allow-Headers": "Content-Type, Digest",

          "Access-Control-Max-Age": "86400",

        }),

      });

    } else {

      return new Response();

    }

  }),

});
```

### Authentication[​](#authentication "Direct link to Authentication")

You can leverage Convex's built-in [authentication](/auth/overview.md) integration and access a user identity from [`ctx.auth.getUserIdentity()`](/api/interfaces/server.Auth.md#getuseridentity). To do this call your endpoint with an `Authorization` header including a JWT token:

myPage.ts

```
const jwtToken = "...";



fetch("https://<deployment name>.convex.site/myAction", {

  headers: {

    Authorization: `Bearer ${jwtToken}`,

  },

});
```


---

<!-- Source: https://docs.convex.dev/scheduling/scheduled-functions -->
Source: https://docs.convex.dev/scheduling/scheduled-functions

# Scheduled Functions

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Convex allows you to schedule functions to run in the future. This allows you to build powerful durable workflows without the need to set up and maintain queues or other infrastructure.

Scheduled functions are stored in the database. This means you can schedule functions minutes, days, and even months in the future. Scheduling is resilient against unexpected downtime or system restarts.

**Example:** [Scheduling](https://github.com/convex/convex-demos/tree/main/scheduling)

## Scheduling functions[​](#scheduling-functions "Direct link to Scheduling functions")

You can schedule public functions and [internal functions](/functions/internal-functions.md) from mutations and actions via the [scheduler](/api/interfaces/server.Scheduler.md) provided in the respective function context.

* [runAfter](/api/interfaces/server.Scheduler.md#runafter) schedules a function to run after a delay (measured in milliseconds).
* [runAt](/api/interfaces/server.Scheduler.md#runat) schedules a function run at a date or timestamp (measured in milliseconds elapsed since the epoch).

The rest of the arguments are the path to the function and its arguments, similar to invoking a function from the client. For example, here is how to send a message that self-destructs in five seconds.

convex/messages.ts

```
import { mutation, internalMutation } from "./_generated/server";

import { internal } from "./_generated/api";

import { v } from "convex/values";



export const sendExpiringMessage = mutation({

  args: { body: v.string(), author: v.string() },

  handler: async (ctx, args) => {

    const { body, author } = args;

    const id = await ctx.db.insert("messages", { body, author });

    await ctx.scheduler.runAfter(5000, internal.messages.destruct, {

      messageId: id,

    });

  },

});



export const destruct = internalMutation({

  args: {

    messageId: v.id("messages"),

  },

  handler: async (ctx, args) => {

    await ctx.db.delete("messages", args.messageId);

  },

});
```

A single function can schedule up to 1000 functions with total argument size of 8MB.

### Scheduling from mutations[​](#scheduling-from-mutations "Direct link to Scheduling from mutations")

Scheduling functions from [mutations](/functions/mutation-functions.md#transactions) is atomic with the rest of the mutation. This means that if the mutation succeeds, the scheduled function is guaranteed to be scheduled. On the other hand, if the mutations fails, no function will be scheduled, even if the function fails after the scheduling call.

### Scheduling from actions[​](#scheduling-from-actions "Direct link to Scheduling from actions")

Unlike mutations, [actions](/functions/actions.md) don't execute as a single database transaction and can have side effects. Thus, scheduling from actions does not depend on the outcome of the function. This means that an action might succeed to schedule some functions and later fail due to transient error or a timeout. The scheduled functions will still be executed.

### Scheduling immediately[​](#scheduling-immediately "Direct link to Scheduling immediately")

Using `runAfter()` with delay set to 0 is used to immediately add a function to the event queue. This usage may be familiar to you if you're used to calling `setTimeout(fn, 0)`.

As noted above, actions are not atomic and are meant to cause side effects. Scheduling immediately becomes useful when you specifically want to trigger an action from a mutation that is conditional on the mutation succeeding. [This post](https://stack.convex.dev/pinecone-and-embeddings#kick-off-a-background-action) goes over a direct example of this in action, where the application depends on an external service to fill in information to the database.

## Retrieving scheduled function status[​](#retrieving-scheduled-function-status "Direct link to Retrieving scheduled function status")

Every scheduled function is reflected as a document in the `"_scheduled_functions"` system table. `runAfter()` and `runAt()` return the id of scheduled function. You can read data from system tables using the `db.system.get` and `db.system.query` methods, which work the same as the standard `db.get` and `db.query` methods.

convex/messages.ts

```
export const listScheduledMessages = query({

  args: {},

  handler: async (ctx, args) => {

    return await ctx.db.system.query("_scheduled_functions").collect();

  },

});



export const getScheduledMessage = query({

  args: {

    id: v.id("_scheduled_functions"),

  },

  handler: async (ctx, args) => {

    return await ctx.db.system.get("_scheduled_functions", args.id);

  },

});
```

This is an example of the returned document:

```
{

  "_creationTime": 1699931054642.111,

  "_id": "3ep33196167235462543626ss0scq09aj4gqn9kdxrdr",

  "args": [{}],

  "completedTime": 1699931054690.366,

  "name": "messages.js:destruct",

  "scheduledTime": 1699931054657,

  "state": { "kind": "success" }

}
```

The returned document has the following fields:

* `name`: the path of the scheduled function

* `args`: the arguments passed to the scheduled function

* `scheduledTime`: the timestamp of when the function is scheduled to run (measured in milliseconds elapsed since the epoch)

* `completedTime`: the timestamp of when the function finished running, if it has completed (measured in milliseconds elapsed since the epoch)

* `state`: the status of the scheduled function. Here are the possible states a scheduled function can be in:

  <!-- -->

  * `Pending`: the function has not been started yet
  * `InProgress`: the function has started running is not completed yet (only applies to actions)
  * `Success`: the function finished running successfully with no errors
  * `Failed`: the function hit an error while running, which can either be a user error or an internal server error
  * `Canceled`: the function was canceled via the dashboard, `ctx.scheduler.cancel`, or recursively by a parent scheduled function that was canceled while in progress

Scheduled function results are available for 7 days after they have completed.

## Canceling scheduled functions[​](#canceling-scheduled-functions "Direct link to Canceling scheduled functions")

You can cancel a previously scheduled function with [`cancel`](/api/interfaces/server.Scheduler.md#cancel) via the [scheduler](/api/interfaces/server.Scheduler.md) provided in the respective function context.

convex/messages.ts

```
export const cancelMessage = mutation({

  args: {

    id: v.id("_scheduled_functions"),

  },

  handler: async (ctx, args) => {

    await ctx.scheduler.cancel(args.id);

  },

});
```

What `cancel` does depends on the state of the scheduled function:

* If it hasn't started running, it won't run.
* If it already started, it will continue to run, but any functions it schedules will not run.

## Debugging[​](#debugging "Direct link to Debugging")

You can view logs from previously executed scheduled functions in the Convex dashboard [Logs view](/dashboard/deployments/logs.md). You can view and cancel yet to be executed functions in the [Functions view](/dashboard/deployments/functions.md).

## Error handling[​](#error-handling "Direct link to Error handling")

Once scheduled, mutations are guaranteed to be executed exactly once. Convex will automatically retry any internal Convex errors, and only fail on developer errors. See [Error Handling](/functions/error-handling/.md) for more details on different error types.

Since actions may have side effects, they are not automatically retried by Convex. Thus, actions will be executed at most once, and permanently fail if there are transient errors while executing them. Developers can retry those manually by scheduling a mutation that checks if the desired outcome has been achieved and if not schedule the action again.

## Auth[​](#auth "Direct link to Auth")

The auth is not propagated from the scheduling to the scheduled function. If you want to authenticate or check authorization, you'll have to pass the requisite user information in as a parameter.


---

<!-- Source: https://docs.convex.dev/scheduling/cron-jobs -->
Source: https://docs.convex.dev/scheduling/cron-jobs

# Cron Jobs

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Convex allows you to schedule functions to run on a recurring basis. For example, cron jobs can be used to clean up data at a regular interval, send a reminder email at the same time every month, or schedule a backup every Saturday.

**Example:** [Cron Jobs](https://github.com/convex/convex-demos/tree/main/cron-jobs)

## Defining your cron jobs[​](#defining-your-cron-jobs "Direct link to Defining your cron jobs")

Cron jobs are defined in a `crons.ts` file in your `convex/` directory and look like:

convex/crons.ts

```
import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";



const crons = cronJobs();



crons.interval(

  "clear messages table",

  { minutes: 1 }, // every minute

  internal.messages.clearAll,

);



crons.monthly(

  "payment reminder",

  { day: 1, hourUTC: 16 }, // Convex chooses the minute within the 16:00 UTC hour

  internal.payments.sendPaymentEmail,

  { email: "my_email@gmail.com" }, // argument to sendPaymentEmail

);



export default crons;
```

The first argument is a unique identifier for the cron job.

The second argument is the schedule at which the function should run, see [Supported schedules](/scheduling/cron-jobs.md#supported-schedules) below.

The third argument is the name of the public function or [internal function](/functions/internal-functions.md), either a [mutation](/functions/mutation-functions.md) or an [action](/functions/actions.md).

## Supported schedules[​](#supported-schedules "Direct link to Supported schedules")

* [`crons.interval()`](/api/classes/server.Crons.md#interval) runs a function every specified number of `seconds`, `minutes`, or `hours`. The first run occurs when the cron job is first deployed to Convex. Unlike traditional crons, this option allows you to have seconds-level granularity.
* [`crons.cron()`](/api/classes/server.Crons.md#cron) the traditional way of specifying cron jobs by a string with five fields separated by spaces (e.g. `"* * * * *"`). Times in cron syntax are in the UTC timezone. [Crontab Guru](https://crontab.guru/) is a helpful resource for understanding and creating schedules in this format.
* [`crons.hourly()`](/api/classes/server.Crons.md#cron), [`crons.daily()`](/api/classes/server.Crons.md#daily), [`crons.weekly()`](/api/classes/server.Crons.md#weekly), [`crons.monthly()`](/api/classes/server.Crons.md#monthly) provide an alternative syntax for common cron schedules with explicitly named arguments. The `minuteUTC` argument is optional. Leave it out and Convex picks a minute for you, spreading runs across the hour.

Avoid scheduling on the exact top of the hour

The top of the hour (minute `0`) is the busiest time on the clock. Apps receive the most inbound traffic, webhooks, and scheduled work right at `:00`. Scheduling recurring work away from the top of the hour keeps it away from your busiest moments and makes it less likely to compete for your app's resources.

The easiest way is to leave `minuteUTC` out and let Convex pick a minute for you, spreading runs across the hour. You can also set a specific off-peak minute if you need a predictable time.

```
// ❌ Runs at the busiest moment of the hour:

crons.daily(

  "send reminder",

  { hourUTC: 17, minuteUTC: 0 },

  internal.emails.send,

);



// ✅ Let Convex pick and spread the minute:

crons.daily("send reminder", { hourUTC: 17 }, internal.emails.send);



// ✅ Or choose a specific off-peak minute:

crons.daily(

  "send reminder",

  { hourUTC: 17, minuteUTC: 23 },

  internal.emails.send,

);
```

The [`@convex-dev/no-top-of-hour-crons`](/linting/overview.md#no-top-of-hour-crons) lint rule flags schedules pinned to the top of the hour.

## Viewing your cron jobs[​](#viewing-your-cron-jobs "Direct link to Viewing your cron jobs")

You can view all your cron jobs in the [Convex dashboard cron jobs view](/dashboard/deployments/schedules.md#cron-jobs-ui). You can view added, updated, and deleted cron jobs in the logs and history view. Results of previously executed runs of the cron jobs are also available in the logs view.

## Error handling[​](#error-handling "Direct link to Error handling")

Mutations and actions have the same guarantees that are described in [Error handling](/scheduling/scheduled-functions.md#error-handling) for scheduled functions.

At most one run of each cron job can be executing at any moment. If the function scheduled by the cron job takes too long to run, following runs of the cron job may be skipped to avoid execution from falling behind. Skipping a scheduled run of a cron job due to the previous run still executing logs a message visible in the logs view of the dashboard.


---

<!-- Source: https://docs.convex.dev/file-storage/overview -->
Source: https://docs.convex.dev/file-storage/overview

# File Storage

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

File Storage makes it easy to implement file upload in your app, store files from and send files to third-party APIs, and to serve dynamic files to your users. All file types are supported.

## Security model[​](#security-model "Direct link to Security model")

File IDs, like `Id<"_storage">`, are safe to store in your tables and pass through Convex functions. They identify stored files, but they are not direct download URLs.

File URLs generated by [`storage.getUrl()`](/api/interfaces/server.StorageReader.md#geturl) are different: **anyone with the URL can access the file** without another app-level authorization check. The only way to revoke a file URL is by deleting the file.

Key implications:

* **Access control happens before the URL is shared**: You can choose who receives a file URL, but you cannot prevent them from reusing or sharing it.
* **Shared URLs are revoked by deleting the file**: If you still need to serve the file, upload it again and share the new URL only with authorized users.
* **Changing access to the same file requires app-level checks**: If a user's access can change over time, use an [HTTP action](/file-storage/serve-files.md#serving-files-from-http-actions) to check permissions before returning file bytes. HTTP action responses are limited to 100 MiB, so they aren't a fit for serving larger files through Convex.

If you need file URLs that automatically expire after some time, consider the [Cloudflare R2 component](https://www.convex.dev/components/cloudflare-r2). Use Convex File Storage URLs only when bearer URL access is acceptable for your use case.

## Features[​](#features "Direct link to Features")

* [Upload](/file-storage/upload-files.md) files to store them in Convex and reference them in your database documents
* [Store](/file-storage/store-files.md) files generated or fetched from third-party APIs
* [Serve](/file-storage/serve-files.md) files via URL
* [Delete](/file-storage/delete-files.md) files stored in Convex
* Access file [metadata](/file-storage/file-metadata.md)

You can manage your stored files on the [dashboard](/dashboard/deployments/file-storage.md).

**Examples:** [File Storage with HTTP Actions](https://github.com/convex/convex-demos/tree/main/file-storage-with-http), [File Storage with Queries and Mutations](https://github.com/convex/convex-demos/tree/main/file-storage)


---

<!-- Source: https://docs.convex.dev/file-storage/upload-files -->
Source: https://docs.convex.dev/file-storage/upload-files

# Uploading and Storing Files

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Upload files to Convex by [generated upload urls](#uploading-files-via-upload-urls), or via a [custom HTTP Action](#uploading-files-via-an-http-action).

## Uploading files via upload URLs[​](#uploading-files-via-upload-urls "Direct link to Uploading files via upload URLs")

Arbitrarily large files can be uploaded directly to your backend using a generated upload URL. This requires the client to make 3 requests:

1. Generate an upload URL using a mutation that calls [`storage.generateUploadUrl()`](/api/interfaces/server.StorageWriter.md#generateuploadurl).
2. Send a POST request with the file contents to the upload URL and receive a storage ID.
3. Save the storage ID into your data model via another mutation.

In the first mutation that generates the upload URL you can control who can upload files to your Convex storage.

**Example**: [File Storage with Queries and Mutations](https://github.com/convex/convex-demos/tree/main/file-storage)

### Calling the upload APIs from a web page[​](#calling-the-upload-apis-from-a-web-page "Direct link to Calling the upload APIs from a web page")

Here's an example of uploading an image via a form submission handler to an upload URL generated by a mutation:

src/App.tsx

```
import { FormEvent, useRef, useState } from "react";

import { useMutation } from "convex/react";

import { api } from "../convex/_generated/api";



export default function App() {

  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const sendImage = useMutation(api.messages.sendImage);



  const imageInput = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);



  const [name] = useState(() => "User " + Math.floor(Math.random() * 10000));

  async function handleSendImage(event: FormEvent) {

    event.preventDefault();



    // Step 1: Get a short-lived upload URL

    const postUrl = await generateUploadUrl();

    // Step 2: POST the file to the URL

    const result = await fetch(postUrl, {

      method: "POST",

      headers: { "Content-Type": selectedImage!.type },

      body: selectedImage,

    });

    const { storageId } = await result.json();

    // Step 3: Save the newly allocated storage id to the database

    await sendImage({ storageId, author: name });



    setSelectedImage(null);

    imageInput.current!.value = "";

  }

  return (

    <form onSubmit={handleSendImage}>

      <input

        type="file"

        accept="image/*"

        ref={imageInput}

        onChange={(event) => setSelectedImage(event.target.files![0])}

        disabled={selectedImage !== null}

      />

      <input

        type="submit"

        value="Send Image"

        disabled={selectedImage === null}

      />

    </form>

  );

}
```

### Generating the upload URL[​](#generating-the-upload-url "Direct link to Generating the upload URL")

An upload URL can be generated by the [`storage.generateUploadUrl`](/api/interfaces/server.StorageWriter.md#generateuploadurl) function of the [`MutationCtx`](/api/interfaces/server.GenericMutationCtx.md) object:

convex/messages.ts

```
import { mutation } from "./_generated/server";



export const generateUploadUrl = mutation({

  args: {},

  handler: async (ctx) => {

    return await ctx.storage.generateUploadUrl();

  },

});
```

This mutation can control who is allowed to upload files.

The upload URL expires in 1 hour and so should be fetched shortly before the upload is made.

### Writing the new storage ID to the database[​](#writing-the-new-storage-id-to-the-database "Direct link to Writing the new storage ID to the database")

Since the storage ID is returned to the client it is likely you will want to persist it in the database via another mutation:

convex/messages.ts

```
import { mutation } from "./_generated/server";



export const sendImage = mutation({

  args: { storageId: v.id("_storage"), author: v.string() },

  handler: async (ctx, args) => {

    await ctx.db.insert("messages", {

      body: args.storageId,

      author: args.author,

      format: "image",

    });

  },

});
```

### Limits[​](#limits "Direct link to Limits")

The file size is not limited, but upload POST request has a 2 minute timeout.

## Uploading files via an HTTP action[​](#uploading-files-via-an-http-action "Direct link to Uploading files via an HTTP action")

The file upload process can be more tightly controlled by leveraging [HTTP action](/functions/http-actions.md)s, performing the whole upload flow using a single request, but requiring correct CORS headers configuration.

The custom upload HTTP action can control who can upload files to your Convex storage.

**Example:** [File Storage with HTTP Actions](https://github.com/convex/convex-demos/tree/main/file-storage-with-http)

### Calling the upload HTTP action from a web page[​](#calling-the-upload-http-action-from-a-web-page "Direct link to Calling the upload HTTP action from a web page")

Here's an example of uploading an image via a form submission handler to the `sendImage` HTTP action defined next.

The highlighted lines make the actual request to the HTTP action:

src/App.tsx

```
import { FormEvent, useRef, useState } from "react";



const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;



export default function App() {

  const imageInput = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);



  async function handleSendImage(event: FormEvent) {

    event.preventDefault();



    // e.g. https://happy-animal-123.convex.site/sendImage?author=User+123

    const sendImageUrl = new URL(`${convexSiteUrl}/sendImage`);

    sendImageUrl.searchParams.set("author", "Jack Smith");



    await fetch(sendImageUrl, {

      method: "POST",

      headers: { "Content-Type": selectedImage!.type },

      body: selectedImage,

    });



    setSelectedImage(null);

    imageInput.current!.value = "";

  }

  return (

    <form onSubmit={handleSendImage}>

      <input

        type="file"

        accept="image/*"

        ref={imageInput}

        onChange={(event) => setSelectedImage(event.target.files![0])}

        disabled={selectedImage !== null}

      />

      <input

        type="submit"

        value="Send Image"

        disabled={selectedImage === null}

      />

    </form>

  );

}
```

### Defining the upload HTTP action[​](#defining-the-upload-http-action "Direct link to Defining the upload HTTP action")

A file sent in the HTTP request body can be stored using the [`storage.store`](/api/interfaces/server.StorageActionWriter.md#store) function of the [`ActionCtx`](/api/interfaces/server.GenericActionCtx.md) object. This function returns an `Id<"_storage">` of the stored file.

From the HTTP action you can call a mutation to write the storage ID to a document in your database.

To confirm success back to your hosted website, you will need to set the right [CORS headers](/functions/http-actions.md#cors):

convex/http.ts

```
import { httpRouter } from "convex/server";

import { env, httpAction } from "./_generated/server";

import { api } from "./_generated/api";

import { Id } from "./_generated/dataModel";



const http = httpRouter();



http.route({

  path: "/sendImage",

  method: "POST",

  handler: httpAction(async (ctx, request) => {

    // Step 1: Store the file

    const blob = await request.blob();

    const storageId = await ctx.storage.store(blob);



    // Step 2: Save the storage ID to the database via a mutation

    const author = new URL(request.url).searchParams.get("author");

    if (author === null) {

      return new Response("Author is required", {

        status: 400,

      });

    }



    await ctx.runMutation(api.messages.sendImage, { storageId, author });



    // Step 3: Return a response with the correct CORS headers

    return new Response(null, {

      status: 200,

      // CORS headers

      headers: new Headers({

        // e.g. https://mywebsite.com, configured on your Convex dashboard

        "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,

        Vary: "origin",

      }),

    });

  }),

});
```

You also need to handle the pre-flight `OPTIONS` request:

convex/http.ts

```
// Pre-flight request for /sendImage

http.route({

  path: "/sendImage",

  method: "OPTIONS",

  handler: httpAction(async (_, request) => {

    // Make sure the necessary headers are present

    // for this to be a valid pre-flight request

    const headers = request.headers;

    if (

      headers.get("Origin") !== null &&

      headers.get("Access-Control-Request-Method") !== null &&

      headers.get("Access-Control-Request-Headers") !== null

    ) {

      return new Response(null, {

        headers: new Headers({

          // e.g. https://mywebsite.com, configured on your Convex dashboard

          "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,

          "Access-Control-Allow-Methods": "POST",

          "Access-Control-Allow-Headers": "Content-Type, Digest",

          "Access-Control-Max-Age": "86400",

        }),

      });

    } else {

      return new Response();

    }

  }),

});
```


---

<!-- Source: https://docs.convex.dev/file-storage/store-files -->
Source: https://docs.convex.dev/file-storage/store-files

# Storing Generated Files

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Files can be uploaded to Convex from a client and stored directly, see [Upload](/file-storage/upload-files.md).

Alternatively files can also be stored after they've been fetched or generated in [actions](/functions/actions.md) and [HTTP actions](/functions/http-actions.md). For example you might call a third-party API to generate an image based on a user prompt and then store that image in Convex.

**Example:** [Dall-E Storage & Action](https://github.com/convex/convex-demos/tree/main/dall-e-storage-action)

## Storing files in actions[​](#storing-files-in-actions "Direct link to Storing files in actions")

Storing files in actions is similar to [uploading a file via an HTTP action](/file-storage/upload-files.md#uploading-files-via-an-http-action).

The action takes these steps:

1. Fetch or generate an image.
2. Store the image using [`storage.store()`](/api/interfaces/server.StorageActionWriter.md#store) and receive a storage ID.
3. Save the storage ID into your data model via a mutation.

Storage IDs correspond to documents in the `"_storage"` system table (see [Metadata](/file-storage/file-metadata.md)), so they can be validated using the `v.id("_storage")` validator and typed as `Id<"_storage">` in TypeScript.

convex/images.ts

```
import { action, internalMutation, query } from "./_generated/server";

import { internal } from "./_generated/api";

import { v } from "convex/values";

import { Id } from "./_generated/dataModel";



export const generateAndStore = action({

  args: { prompt: v.string() },

  handler: async (ctx, args) => {

    // Not shown: generate imageUrl from `prompt`

    const imageUrl = "https://....";



    // Download the image

    const response = await fetch(imageUrl);

    const image = await response.blob();



    // Store the image in Convex

    const storageId: Id<"_storage"> = await ctx.storage.store(image);



    // Write `storageId` to a document

    await ctx.runMutation(internal.images.storeResult, {

      storageId,

      prompt: args.prompt,

    });

  },

});



export const storeResult = internalMutation({

  args: {

    storageId: v.id("_storage"),

    prompt: v.string(),

  },

  handler: async (ctx, args) => {

    const { storageId, prompt } = args;

    await ctx.db.insert("images", { storageId, prompt });

  },

});
```


---

<!-- Source: https://docs.convex.dev/file-storage/serve-files -->
Source: https://docs.convex.dev/file-storage/serve-files

# Serving Files

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Files stored in Convex can be served to your users by generating a URL pointing to a given file.

## Generating file URLs in queries[​](#generating-file-urls-in-queries "Direct link to Generating file URLs in queries")

The simplest way to serve files is to return URLs along with other data required by your app from [queries](/functions/query-functions.md) and [mutations](/functions/mutation-functions.md).

A file URL can be generated from a storage ID by the [`storage.getUrl`](/api/interfaces/server.StorageReader.md#geturl) function of the [`QueryCtx`](/api/interfaces/server.GenericQueryCtx.md), [`MutationCtx`](/api/interfaces/server.GenericMutationCtx.md), or [`ActionCtx`](/api/interfaces/server.GenericActionCtx.md) object:

convex/listMessages.ts

```
import { query } from "./_generated/server";



export const list = query({

  args: {},

  handler: async (ctx) => {

    const messages = await ctx.db.query("messages").collect();

    return Promise.all(

      messages.map(async (message) => ({

        ...message,

        // If the message is an "image" its `body` is an `Id<"_storage">`

        ...(message.format === "image"

          ? { url: await ctx.storage.getUrl(message.body) }

          : {}),

      })),

    );

  },

});
```

File URLs can be used in `img` elements to render images:

src/App.tsx

```
function Image({ message }: { message: { url: string } }) {

  return <img src={message.url} height="300px" width="auto" />;

}
```

Security consideration

File IDs, like `Id<"_storage">`, are safe to store and pass through Convex functions. File URLs are different: **anyone with the URL can access the file** without further authentication from your app.

In your query you can control who receives the URL, but once shared, that URL can be reused or shared. **To revoke a shared URL, delete the file.** If you still need to serve the file, upload it again and share the new URL only with authorized users.

If you need to authenticate or authorize access each time the file is requested, use [HTTP actions](#serving-files-from-http-actions) and avoid exposing direct file URLs to the client.

## Serving files from HTTP actions[​](#serving-files-from-http-actions "Direct link to Serving files from HTTP actions")

For files requiring access control on every request, serve files directly from [HTTP actions](/functions/http-actions.md). The HTTP action should authenticate the request and check that the caller can access the file before returning bytes.

If your permissions live on another app document, use that document's ID in the URL, such as a message ID or file document ID. Then look up the storage ID server-side after checking permissions.

It is also fine for the client to pass an `Id<"_storage">` to an authenticated HTTP action, as long as the action checks that the caller can access that file. Do not use the storage ID as the only access check. HTTP action responses are [currently limited](/functions/http-actions.md#limits) to 100 MiB, so they aren't a fit for serving larger files through Convex.

If you need file URLs that automatically expire after some time, consider the [Cloudflare R2 component](https://www.convex.dev/components/cloudflare-r2). Use Convex File Storage URLs as described [above](#generating-file-urls-in-queries) only when bearer URL access is acceptable for your use case.

The small example below passes a storage ID in the URL so it can focus on `storage.get()`. For private files, add authentication and authorization checks before returning the file.

A file [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object can be generated from a storage ID by the [`storage.get`](/api/interfaces/server.StorageActionWriter.md#get) function of the [`ActionCtx`](/api/interfaces/server.GenericActionCtx.md) object, which can be returned in a `Response`:

convex/http.ts

```
import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";

import { Id } from "./_generated/dataModel";



const http = httpRouter();



http.route({

  path: "/getImage",

  method: "GET",

  handler: httpAction(async (ctx, request) => {

    const { searchParams } = new URL(request.url);

    const storageId = searchParams.get("storageId")! as Id<"_storage">;

    const blob = await ctx.storage.get(storageId);

    if (blob === null) {

      return new Response("Image not found", {

        status: 404,

      });

    }

    return new Response(blob);

  }),

});



export default http;
```

The URL of such an action can be used directly in `img` elements to render images:

src/App.tsx

```
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;



function Image({ storageId }: { storageId: string }) {

  // e.g. https://happy-animal-123.convex.site/getImage?storageId=456

  const getImageUrl = new URL(`${convexSiteUrl}/getImage`);

  getImageUrl.searchParams.set("storageId", storageId);



  return <img src={getImageUrl.href} height="300px" width="auto" />;

}
```


---

<!-- Source: https://docs.convex.dev/client/javascript/node -->
Source: https://docs.convex.dev/client/javascript/node

# Node.js

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Convex supports point-in-time queries (see [HTTP client](/api/classes/browser.ConvexHttpClient.md)) and query subscriptions (see [ConvexClient](/api/classes/browser.ConvexClient.md)) in Node.js.

If your JavaScript code uses import/export syntax, calling Convex functions works just like in a browser.

```
import { ConvexHttpClient, ConvexClient } from "convex/browser";

import { api } from "./convex/_generated/api.js";



// HTTP client

const httpClient = new ConvexHttpClient(CONVEX_URL_GOES_HERE);

httpClient.query(api.messages.list).then(console.log);



// Subscription client

const client = new ConvexClient(CONVEX_URL_GOES_HERE);

client.onUpdate(api.messages.list, {}, (messages) => console.log(messages));
```

## TypeScript[​](#typescript "Direct link to TypeScript")

Just like bundling for the browser, bundling TypeScript code for Node.js with webpack, esbuild, rollup, vite, and others usually allow you import from code that uses import/export syntax with no extra setup.

If you use TypeScript to *compile* your code (this is rare for web projects but more common with Node.js), add `"allowJs": true` to `tsconfig.json` compiler options so that TypeScript will compile the `api.js` file as well.

## TypeScript without a compile step[​](#typescript-without-a-compile-step "Direct link to TypeScript without a compile step")

If you want to run your TypeScript script directly without a compile step, installing [ts-node-esm](https://www.npmjs.com/package/ts-node) and running your script with ts-node-esm should work if you use `"type": "module"` in your `package.json`.

## JavaScript with CommonJS (`require()` syntax)[​](#javascript-with-commonjs-require-syntax "Direct link to javascript-with-commonjs-require-syntax")

If you don't use `"type": "module"` in the `package.json` of your project you'll need to use `require()` syntax and Node.js will not be able to import the `convex/_generated/api.js` file directly.

In the same directory as your `package.json`, create or edit [`convex.json`](/config/convex.json.md):

```
{

  "generateCommonJSApi": true

}
```

When the `convex dev` command generates files in `convex/_generated/` a new `api_cjs.cjs` file will be created which can be imported from CommonJS code.

```
const { ConvexHttpClient, ConvexClient } = require("convex/browser");

const { api } = require("./convex/_generated/api_cjs.cjs");

const httpClient = new ConvexHttpClient(CONVEX_URL_GOES_HERE);
```

## TypeScript with CommonJS without a compile step[​](#typescript-with-commonjs-without-a-compile-step "Direct link to TypeScript with CommonJS without a compile step")

Follow the steps above for CommonJS and use [`ts-node`](https://www.npmjs.com/package/ts-node) to run you code. Be sure your `tsconfig.json` is configured for CommonJS output.

## Using Convex with Node.js without codegen[​](#using-convex-with-nodejs-without-codegen "Direct link to Using Convex with Node.js without codegen")

You can always use the `anyApi` object or strings if you don't have the Convex functions and api file handy. An api reference like `api.folder.file.exportName` becomes `anyApi.folder.file.exportName` or `"folder/file:exportName"`.


---

<!-- Source: https://docs.convex.dev/client/javascript/overview -->
Source: https://docs.convex.dev/client/javascript/overview

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# Convex JavaScript Clients

Convex applications can be accessed from Node.js or any JavaScript runtime that implements [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) or [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). The reactive [Convex Client](/api/classes/browser.ConvexClient.md) allows web applications and long-running Node.js servers to subscribe to updates on Convex queries, while the [Convex HTTP client](/api/classes/browser.ConvexHttpClient.md) is typically used for server-side rendering, migrations, administrative scripts, and serverless functions to run queries at a single point in time.

If you're using React, see the dedicated [`ConvexReactClient`](/api/classes/browser.ConvexClient.md) described in [React](/client/react/overview.md).

## Convex Client[​](#convex-client "Direct link to Convex Client")

The [`ConvexClient`](/api/classes/browser.ConvexClient.md) provides subscriptions to queries in Node.js and any JavaScript environment that supports WebSockets.

<!-- -->

script.ts

```
import { ConvexClient } from "convex/browser";

import { api } from "../convex/_generated/api";



const client = new ConvexClient(process.env.CONVEX_URL!);



// subscribe to query results

client.onUpdate(api.messages.listAll, {}, (messages) =>

  console.log(messages.map((msg) => msg.body)),

);



// execute a mutation

function hello() {

  client.mutation(api.messages.sendAnon, {

    body: `hello at ${new Date()}`,

  });

}
```

The Convex client is open source and available on [GitHub](https://github.com/convex/convex-js).

See the [Script Tag Quickstart](/quickstart/script-tag.md) to get started.

## HTTP client[​](#http-client "Direct link to HTTP client")

<!-- -->

The [`ConvexHttpClient`](/api/classes/browser.ConvexHttpClient.md) works in the browser, Node.js, and any JavaScript environment with `fetch`.

See the [Node.js Quickstart](/quickstart/nodejs.md).

script.ts

```
import { ConvexHttpClient } from "convex/browser";

import { api } from "./convex/_generated/api";



const client = new ConvexHttpClient(process.env["CONVEX_URL"]);



// either this

const count = await client.query(api.counter.get);

// or this

client.query(api.counter.get).then((count) => console.log(count));
```

## Using Convex without generated `convex/_generated/api.js`[​](#using-convex-without-generated-convex_generatedapijs "Direct link to using-convex-without-generated-convex_generatedapijs")

If the source code for your Convex function isn't located in the same project or in the same monorepos you can use the untyped `api` object called `anyApi`.

<!-- -->

script.ts

```
import { ConvexClient } from "convex/browser";

import { anyApi } from "convex/server";



const CONVEX_URL = "http://happy-otter-123";

const client = new ConvexClient(CONVEX_URL);

client.onUpdate(anyApi.messages.list, {}, (messages) =>

  console.log(messages.map((msg) => msg.body)),

);

setInterval(

  () =>

    client.mutation(anyApi.messages.send, {

      body: `hello at ${new Date()}`,

      author: "me",

    }),

  5000,

);
```


---

<!-- Source: https://docs.convex.dev/api/classes/browser.ConvexHttpClient -->
Source: https://docs.convex.dev/api/classes/browser.ConvexHttpClient

# Class: ConvexHttpClient

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

[browser](/api/modules/browser.md).ConvexHttpClient

A Convex client that runs queries and mutations over HTTP.

This client is stateful (it has user credentials and queues mutations) so take care to avoid sharing it between requests in a server.

This is appropriate for server-side code (like Netlify Lambdas) or non-reactive webapps.

## Constructors[​](#constructors "Direct link to Constructors")

### constructor[​](#constructor "Direct link to constructor")

• **new ConvexHttpClient**(`address`, `options?`)

Create a new [ConvexHttpClient](/api/classes/browser.ConvexHttpClient.md).

#### Parameters[​](#parameters "Direct link to Parameters")

| Name                                    | Type                                                                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `address`                               | `string`                                                                                                                                                                     | The url of your Convex deployment, often provided by an environment variable. E.g. `https://small-mouse-123.convex.cloud`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `options?`                              | `Object`                                                                                                                                                                     | An object of options. - `skipConvexDeploymentUrlCheck` - Skip validating that the Convex deployment URL looks like `https://happy-animal-123.convex.cloud` or localhost. This can be useful if running a self-hosted Convex backend that uses a different URL. - `logger` - A logger or a boolean. If not provided, logs to the console. You can construct your own logger to customize logging to log elsewhere or not log at all, or use `false` as a shorthand for a no-op logger. A logger is an object with 4 methods: log(), warn(), error(), and logVerbose(). These methods can receive multiple arguments of any types, like console.log(). - `auth` - A JWT containing identity claims accessible in Convex functions. This identity may expire so it may be necessary to call `setAuth()` later, but for short-lived clients it's convenient to specify this value here. - `fetch` - A custom fetch implementation to use for all HTTP requests made by this client. |
| `options.skipConvexDeploymentUrlCheck?` | `boolean`                                                                                                                                                                    | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `options.logger?`                       | `boolean` \| `Logger`                                                                                                                                                        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `options.auth?`                         | `string`                                                                                                                                                                     | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `options.fetch?`                        | (`input`: `URL` \| `RequestInfo`, `init?`: `RequestInit`) => `Promise`<`Response`>(`input`: `string` \| `URL` \| `Request`, `init?`: `RequestInit`) => `Promise`<`Response`> | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

#### Defined in[​](#defined-in "Direct link to Defined in")

[browser/http\_client.ts:100](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L100)

## Accessors[​](#accessors "Direct link to Accessors")

### url[​](#url "Direct link to url")

• `get` **url**(): `string`

Return the address for this client, useful for creating a new client.

Not guaranteed to match the address with which this client was constructed: it may be canonicalized.

#### Returns[​](#returns "Direct link to Returns")

`string`

#### Defined in[​](#defined-in-1 "Direct link to Defined in")

[browser/http\_client.ts:150](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L150)

## Methods[​](#methods "Direct link to Methods")

### backendUrl[​](#backendurl "Direct link to backendUrl")

▸ **backendUrl**(): `string`

Obtain the [ConvexHttpClient](/api/classes/browser.ConvexHttpClient.md)'s URL to its backend.

**`Deprecated`**

Use url, which returns the url without /api at the end.

#### Returns[​](#returns-1 "Direct link to Returns")

`string`

The URL to the Convex backend, including the client's API version.

#### Defined in[​](#defined-in-2 "Direct link to Defined in")

[browser/http\_client.ts:140](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L140)

***

### setAuth[​](#setauth "Direct link to setAuth")

▸ **setAuth**(`value`): `void`

Set the authentication token to be used for subsequent queries and mutations.

Should be called whenever the token changes (i.e. due to expiration and refresh).

#### Parameters[​](#parameters-1 "Direct link to Parameters")

| Name    | Type     | Description                                |
| ------- | -------- | ------------------------------------------ |
| `value` | `string` | JWT-encoded OpenID Connect identity token. |

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Defined in[​](#defined-in-3 "Direct link to Defined in")

[browser/http\_client.ts:161](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L161)

***

### clearAuth[​](#clearauth "Direct link to clearAuth")

▸ **clearAuth**(): `void`

Clear the current authentication token if set.

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### Defined in[​](#defined-in-4 "Direct link to Defined in")

[browser/http\_client.ts:187](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L187)

***

### consistentQuery[​](#consistentquery "Direct link to consistentQuery")

▸ **consistentQuery**<`Query`>(`query`, `...args`): `Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Query`>>

This API is experimental: it may change or disappear.

Execute a Convex query function at the same timestamp as every other consistent query execution run by this HTTP client.

This doesn't make sense for long-lived ConvexHttpClients as Convex backends can read a limited amount into the past: beyond 30 seconds in the past may not be available.

Create a new client to use a consistent time.

**`Deprecated`**

This API is experimental: it may change or disappear.

#### Type parameters[​](#type-parameters "Direct link to Type parameters")

| Name    | Type                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Query` | extends [`FunctionReference`](/api/modules/server.md#functionreference)<`"query"`> \| [`FunctionReference_future`](/api/modules/server.md#functionreference_future)<`"query"`> |

#### Parameters[​](#parameters-2 "Direct link to Parameters")

| Name      | Type                                                                   | Description                                                                         |
| --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `query`   | `Query`                                                                | -                                                                                   |
| `...args` | [`OptionalRestArgs`](/api/modules/server.md#optionalrestargs)<`Query`> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns[​](#returns-4 "Direct link to Returns")

`Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Query`>>

A promise of the query's result.

#### Defined in[​](#defined-in-5 "Direct link to Defined in")

[browser/http\_client.ts:229](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L229)

***

### query[​](#query "Direct link to query")

▸ **query**<`Query`>(`query`, `...args`): `Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Query`>>

Execute a Convex query function.

#### Type parameters[​](#type-parameters-1 "Direct link to Type parameters")

| Name    | Type                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Query` | extends [`FunctionReference`](/api/modules/server.md#functionreference)<`"query"`> \| [`FunctionReference_future`](/api/modules/server.md#functionreference_future)<`"query"`> |

#### Parameters[​](#parameters-3 "Direct link to Parameters")

| Name      | Type                                                                   | Description                                                                         |
| --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `query`   | `Query`                                                                | -                                                                                   |
| `...args` | [`OptionalRestArgs`](/api/modules/server.md#optionalrestargs)<`Query`> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns[​](#returns-5 "Direct link to Returns")

`Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Query`>>

A promise of the query's result.

#### Defined in[​](#defined-in-6 "Direct link to Defined in")

[browser/http\_client.ts:277](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L277)

***

### mutation[​](#mutation "Direct link to mutation")

▸ **mutation**<`Mutation`>(`mutation`, `...args`): `Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Mutation`>>

Execute a Convex mutation function. Mutations are queued by default.

#### Type parameters[​](#type-parameters-2 "Direct link to Type parameters")

| Name       | Type                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Mutation` | extends [`FunctionReference`](/api/modules/server.md#functionreference)<`"mutation"`> \| [`FunctionReference_future`](/api/modules/server.md#functionreference_future)<`"mutation"`> |

#### Parameters[​](#parameters-4 "Direct link to Parameters")

| Name       | Type                                                                                                                                        | Description                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `mutation` | `Mutation`                                                                                                                                  | -                                                                                      |
| `...args`  | [`ArgsAndOptions`](/api/modules/server.md#argsandoptions)<`Mutation`, [`HttpMutationOptions`](/api/modules/browser.md#httpmutationoptions)> | The arguments object for the mutation. If this is omitted, the arguments will be `{}`. |

#### Returns[​](#returns-6 "Direct link to Returns")

`Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Mutation`>>

A promise of the mutation's result.

#### Defined in[​](#defined-in-7 "Direct link to Defined in")

[browser/http\_client.ts:453](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L453)

***

### action[​](#action "Direct link to action")

▸ **action**<`Action`>(`action`, `...args`): `Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Action`>>

Execute a Convex action function. Actions are not queued.

#### Type parameters[​](#type-parameters-3 "Direct link to Type parameters")

| Name     | Type                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Action` | extends [`FunctionReference`](/api/modules/server.md#functionreference)<`"action"`> \| [`FunctionReference_future`](/api/modules/server.md#functionreference_future)<`"action"`> |

#### Parameters[​](#parameters-5 "Direct link to Parameters")

| Name      | Type                                                                    | Description                                                                          |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `action`  | `Action`                                                                | -                                                                                    |
| `...args` | [`OptionalRestArgs`](/api/modules/server.md#optionalrestargs)<`Action`> | The arguments object for the action. If this is omitted, the arguments will be `{}`. |

#### Returns[​](#returns-7 "Direct link to Returns")

`Promise`<[`FunctionReturnType`](/api/modules/server.md#functionreturntype)<`Action`>>

A promise of the action's result.

#### Defined in[​](#defined-in-8 "Direct link to Defined in")

[browser/http\_client.ts:480](https://github.com/convex/convex-js/blob/main/src/browser/http_client.ts#L480)


---

<!-- Source: https://docs.convex.dev/client/react/overview -->
Source: https://docs.convex.dev/client/react/overview

# Convex React

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Convex React is the client library enabling your React application to interact with your Convex backend. It allows your frontend code to:

1. Call your [queries](/functions/query-functions.md), [mutations](/functions/mutation-functions.md) and [actions](/functions/actions.md)
2. Upload and display files from [File Storage](/file-storage/overview.md)
3. Authenticate users using [Authentication](/auth/overview.md)
4. Implement full text [Search](/search/overview.md) over your data

The Convex React client is open source and available on [GitHub](https://github.com/convex/convex-js).

Follow the [React Quickstart](/quickstart/react.md) to get started with React using [Vite](https://vitejs.dev/).

## Installation[​](#installation "Direct link to Installation")

Convex React is part of the `convex` npm package:

```
npm install convex
```

## Connecting to a backend[​](#connecting-to-a-backend "Direct link to Connecting to a backend")

The [`ConvexReactClient`](/api/classes/react.ConvexReactClient.md) maintains a connection to your Convex backend, and is used by the React hooks described below to call your functions.

First you need to create an instance of the client by giving it your backend deployment URL. See [Configuring Deployment URL](/client/react/deployment-urls.md) on how to pass in the right value:

```
import { ConvexProvider, ConvexReactClient } from "convex/react";



const convex = new ConvexReactClient("https://<your domain here>.convex.cloud");
```

And then you make the client available to your app by passing it in to a [`ConvexProvider`](/api/modules/react.md#convexprovider) wrapping your component tree:

```
reactDOMRoot.render(

  <React.StrictMode>

    <ConvexProvider client={convex}>

      <App />

    </ConvexProvider>

  </React.StrictMode>,

);
```

## Fetching data[​](#fetching-data "Direct link to Fetching data")

Your React app fetches data using the [`useQuery`](/api/modules/react.md#usequery) React hook by calling your [queries](/functions/query-functions.md) via an [`api`](/generated-api/api.md#api) object.

The `npx convex dev` command generates this api object for you in the `convex/_generated/api.js` module to provide better autocompletion in JavaScript and end-to-end type safety in [TypeScript](/understanding/best-practices/typescript.md):

src/App.tsx

```
import { useQuery } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  const data = useQuery(api.functions.myQuery);

  return data ?? "Loading...";

}
```

The `useQuery` hook returns `undefined` while the data is first loading and afterwards the return value of your query.

### Query arguments[​](#query-arguments "Direct link to Query arguments")

Arguments to your query follow the query name:

src/App.tsx

```
export function App() {

  const a = "Hello world";

  const b = 4;

  const data = useQuery(api.functions.myQuery, { a, b });

  //...

}
```

### Reactivity[​](#reactivity "Direct link to Reactivity")

The `useQuery` hook makes your app automatically reactive: when the underlying data changes in your database, your component rerenders with the new query result.

The first time the hook is used it creates a subscription to your backend for a given query and any arguments you pass in. When your component unmounts, the subscription is canceled.

### Consistency[​](#consistency "Direct link to Consistency")

Convex React ensures that your application always renders a consistent view of the query results based on a single state of the underlying database.

Imagine a mutation changes some data in the database, and that 2 different `useQuery` call sites rely on this data. Your app will never render in an inconsistent state where only one of the `useQuery` call sites reflects the new data.

### Experimental: query result object[​](#experimental-query-result-object "Direct link to Experimental: query result object")

If you want a richer result object to handle when querying, try `useQuery_experimental`. It always returns an object with a `status` field, and does not throw errors by default.

The `status` of the result object will be one of `"pending" | "success" | "error"`. To help ensure correct handling of query results, the return type requires that you check the `status` before accessing other fields (`data` or `error`).

src/App.tsx

```
import { useQuery_experimental as useQuery } from "convex/react";

import { api } from "../convex/_generated/api";



function TaskList() {

  const result = useQuery({

    query: api.tasks.list,

    args: { completed: false },

  });



  if (result.status === "pending") return <div>Loading...</div>;

  if (result.status === "error")

    return <div>Error: {result.error.message}</div>;

  // `status` guaranteed to be `"success"` at this point; `data` available.

  return result.data.map((task) => <div key={task._id}>{task.text}</div>);

}
```

If you're migrating existing code that leverages error boundaries, you can use the `throwOnError: true` option to maintain that behavior.

### Paginating queries[​](#paginating-queries "Direct link to Paginating queries")

See [Paginating within React Components](/database/pagination.md#paginating-within-react-components).

### Skipping queries[​](#skipping-queries "Direct link to Skipping queries")

Advanced: Loading a query conditionally

With React it can be tricky to dynamically invoke a hook, because hooks cannot be placed inside conditionals or after early returns:

src/App.tsx

```
import { useQuery } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  // the URL `param` might be null

  const param = new URLSearchParams(window.location.search).get("param");

  // ERROR! React Hook "useQuery" is called conditionally. React Hooks must

  // be called in the exact same order in every component render.

  const data = param !== null ? useQuery(api.functions.read, { param }) : null;

  //...

}
```

For this reason `useQuery` can be "disabled" by passing in `"skip"` instead of its arguments:

src/App.tsx

```
import { useQuery } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  const param = new URLSearchParams(window.location.search).get("param");

  const data = useQuery(

    api.functions.read,

    param !== null ? { param } : "skip",

  );

  //...

}
```

When `"skip"` is used the `useQuery` doesn't talk to your backend at all and returns `undefined`.

### One-off queries[​](#one-off-queries "Direct link to One-off queries")

Advanced: Fetching a query from a callback

Sometimes you might want to read state from the database in response to a user action, for example to validate given input, without making any changes to the database. In this case you can use a one-off [`query`](/api/classes/react.ConvexReactClient.md#query) call, similarly to calling mutations and actions.

The async method `query` is exposed on the `ConvexReactClient`, which you can reference in your components via the [`useConvex()`](/api/modules/react.md#useconvex) hook.

src/App.tsx

```
import { useConvex } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  const convex = useConvex();

  return (

    <button

      onClick={async () => {

        console.log(await convex.query(api.functions.myQuery));

      }}

    >

      Check

    </button>

  );

}
```

## Editing data[​](#editing-data "Direct link to Editing data")

Your React app edits data using the [`useMutation`](/api/modules/react.md#usemutation) React hook by calling your [mutations](/functions/mutation-functions.md).

The `convex dev` command generates this api object for you in the `convex/_generated/api.js` module to provide better autocompletion in JavaScript and end-to-end type safety in [TypeScript](/understanding/best-practices/typescript.md):

src/App.tsx

```
import { useMutation } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  const doSomething = useMutation(api.functions.doSomething);

  return <button onClick={() => doSomething()}>Click me</button>;

}
```

The hook returns an `async` function which performs the call to the mutation.

### Mutation arguments[​](#mutation-arguments "Direct link to Mutation arguments")

Arguments to your mutation are passed to the `async` function returned from `useMutation`:

src/App.tsx

```
export function App() {

  const a = "Hello world";

  const b = 4;

  const doSomething = useMutation(api.functions.doSomething);

  return <button onClick={() => doSomething({ a, b })}>Click me</button>;

}
```

### Mutation response and error handling[​](#mutation-response-and-error-handling "Direct link to Mutation response and error handling")

The mutation can optionally return a value or throw errors, which you can [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await):

src/App.tsx

```
export function App() {

  const doSomething = useMutation(api.functions.doSomething);

  const onClick = () => {

    async function callBackend() {

      try {

        const result = await doSomething();

      } catch (error) {

        console.error(error);

      }

      console.log(result);

    }

    void callBackend();

  };

  return <button onClick={onClick}>Click me</button>;

}
```

Or handle as a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise):

src/App.tsx

```
export function App() {

  const doSomething = useMutation(api.functions.doSomething);

  const onClick = () => {

    doSomething()

      .catch((error) => {

        console.error(error);

      })

      .then((result) => {

        console.log(result);

      });

  };

  return <button onClick={onClick}>Click me</button>;

}
```

Learn more about [Error Handling](/functions/error-handling/.md) in functions.

### Retries[​](#retries "Direct link to Retries")

Convex React automatically retries mutations until they are confirmed to have been written to the database. The Convex backend ensures that despite multiple retries, every mutation call only executes once.

Additionally, Convex React will warn users if they try to close their browser tab while there are outstanding mutations. This means that when you call a Convex mutation, you can be sure that the user's edits won't be lost.

### Optimistic updates[​](#optimistic-updates "Direct link to Optimistic updates")

Convex queries are fully reactive, so all query results will be automatically updated after a mutation. Sometimes you may want to update the UI before the mutation changes propagate back to the client. To accomplish this, you can configure an *optimistic update* to execute as part of your mutation.

Optimistic updates are temporary, local changes to your query results which are used to make your app more responsive.

See [Optimistic Updates](/client/react/optimistic-updates.md) on how to configure them.

## Calling third-party APIs[​](#calling-third-party-apis "Direct link to Calling third-party APIs")

Your React app can read data, call third-party services, and write data with a single backend call using the [`useAction`](/api/modules/react.md#useaction) React hook by calling your [actions](/functions/actions.md).

Like `useQuery` and `useMutation`, this hook is used with the `api` object generated for you in the `convex/_generated/api.js` module to provide better autocompletion in JavaScript and end-to-end type safety in [TypeScript](/understanding/best-practices/typescript.md):

src/App.tsx

```
import { useAction } from "convex/react";

import { api } from "../convex/_generated/api";



export function App() {

  const doSomeAction = useAction(api.functions.doSomeAction);

  return <button onClick={() => doSomeAction()}>Click me</button>;

}
```

The hook returns an `async` function which performs the call to the action.

### Action arguments[​](#action-arguments "Direct link to Action arguments")

Action arguments work exactly the same as [mutation arguments](#mutation-arguments).

### Action response and error handling[​](#action-response-and-error-handling "Direct link to Action response and error handling")

Action response and error handling work exactly the same as [mutation response and error handling](#mutation-response-and-error-handling).

Actions do not support automatic retries or optimistic updates.

## Under the hood[​](#under-the-hood "Direct link to Under the hood")

The [`ConvexReactClient`](/api/classes/react.ConvexReactClient.md) connects to your Convex deployment by creating a [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). The WebSocket provides a 2-way communication channel over TCP. This allows Convex to push new query results reactively to the client without the client needing to poll for updates.

If the internet connection drops, the client will handle reconnecting and re-establishing the Convex session automatically.


---

<!-- Source: https://docs.convex.dev/production/environment-variables -->
Source: https://docs.convex.dev/production/environment-variables

# Environment Variables

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

Environment variables are key-value pairs that are useful for storing values you wouldn't want to put in code or in a table, such as an API key. You can set environment variables in Convex through the dashboard and access them in [functions](/functions/overview.md).

For the best experience, [declare your environment variables](#declaring) in `convex/convex.config.ts` to get type-safe access via the generated `env` object. You can also access any environment variable via `process.env`.

## Setting environment variables[​](#setting-environment-variables "Direct link to Setting environment variables")

Under [Deployment Settings](/dashboard/deployments/deployment-settings.md) in the Dashboard, you can see a list of environment variables in the current deployment.

![Environment variables table](/screenshots/storybook/components_deployment_environment_variables_light.webp)

You can add up to 512 environment variables, and the total size of all environment variables (names + values) cannot exceed 512KiB. Environment variable names cannot be more than 256 characters long, and they must start with a letter and only contain letters, numbers, and underscores. Environment variable values cannot be larger than 8KiB.

You can modify environment variables using the pencil icon button:

![Edit environment variable](/screenshots/storybook/components_deployment_environment_variables_edit_inline_light.webp)

Environment variables can also be viewed and modified from the [command line](/cli/reference/env.md).

```
npx convex env list --names-only

npx convex env get NAME

npx convex env set NAME 'value'

npx convex env set --from-file .env.convex

npx convex env remove NAME
```

### Using environment variables in dev and prod deployments[​](#using-environment-variables-in-dev-and-prod-deployments "Direct link to Using environment variables in dev and prod deployments")

Since environment variables are set per-deployment, you can use different values for the same key in dev and prod deployments. This can be useful for when you have different external accounts you'd like to use depending on the environment. For example, you might have a dev and prod SendGrid account for sending emails, and your function expects an environment variable called `SENDGRID_API_KEY` that should work in both environments.

If you expect an environment variable to be always present in a function, you must add it to **all** your deployments. In this example, you would add an environment variable with the name `SENDGRID_API_KEY` to your dev and prod deployments, with a different value for dev and prod.

## Declaring environment variables[​](#declaring "Direct link to Declaring environment variables")

You can declare the environment variables your app expects in `convex/convex.config.ts`. Declared environment variables give you type-safe access, validation at deploy time, and clear documentation of what your app needs to run. This also helps prevent removing required environment variables or setting them to invalid values from the dashboard or `npx convex env [remove|set] ...`.

convex/convex.config.ts

```
import { defineApp } from "convex/server";

import { v } from "convex/values";



const app = defineApp({

  env: {

    GIPHY_KEY: v.string(),

    LOG_LEVEL: v.optional(

      v.union(v.literal("debug"), v.literal("info"), v.literal("error")),

    ),

  },

});



export default app;
```

The `env` option maps variable names to validators from `convex/values`. The supported validators are:

* `v.string()` — any string value
* `v.literal("value")` — an exact string value
* `v.union(v.literal("a"), v.literal("b"))` — one of several exact values
* `v.optional(...)` — wraps any of the above to mark a variable as optional

After running `npx convex dev`, Convex generates a typed `env` object that you import from `_generated/server`:

convex/myFunction.ts

```
import { query, env } from "./_generated/server";



export const gifUrl = query({

  args: {},

  handler: async () => {

    // env.GIPHY_KEY is typed as `string`

    // env.LOG_LEVEL is typed as `"debug" | "info" | "error" | undefined`

    return (

      "https://api.giphy.com/v1/gifs/translate?api_key=" +

      env.GIPHY_KEY +

      "&s=cats"

    );

  },

});
```

The `env` import works in queries, mutations, actions, and HTTP actions. TypeScript will catch typos and type mismatches at build time rather than at runtime.

You still need to [set the actual values](#setting-environment-variables) in the dashboard or CLI — declaring them in `convex.config.ts` defines what's expected, not what the values are.

note

Declaring environment variables is optional. If you don't declare them, you can still access all environment variables via `process.env` as described [below](#accessing-via-process-env), just without any guarantees about what value they contain.

### Passing environment variables to components[​](#component-env-vars "Direct link to Passing environment variables to components")

[Components](/components/overview.md) are isolated from the app's environment variables. When a component declares environment variables in its `convex.config.ts`, you can provide environment variables when installing it:

convex/convex.config.ts

```
import { defineApp } from "convex/server";

import { v } from "convex/values";

import myComponent from "@example/my-component/convex.config";



const app = defineApp({

  env: {

    LOG_LEVEL: v.union(

      v.literal("debug"),

      v.literal("info"),

      v.literal("error"),

    ),

  },

});



// Pass by reference — the component's LOG_SEVERITY will always

// match this app's LOG_LEVEL - even when it changes between deploys.

app.use(myComponent, { env: { LOG_SEVERITY: app.env.LOG_LEVEL } });



export default app;
```

You can also populate component environment variables via literal values:

convex/convex.config.ts

```
// Pass a literal value

app.use(myComponent, { env: { LOG_SEVERITY: "debug" } });
```

See [Authoring Components: Environment Variables](/components/authoring.md#environment-variables) for how to declare environment variables in a component.

## Accessing environment variables via `process.env`[​](#accessing-via-process-env "Direct link to accessing-via-process-env")

You can access environment variables in Convex functions using `process.env.KEY`. If the variable is set it is a `string`, otherwise it is `undefined`. Here is an example of accessing an environment variable with the key `GIPHY_KEY`:

```
function giphyUrl(query) {

  return (

    "https://api.giphy.com/v1/gifs/translate?api_key=" +

    process.env.GIPHY_KEY +

    "&s=" +

    encodeURIComponent(query)

  );

}
```

tip

If you've [declared your environment variables](#declaring) in `convex.config.ts`, prefer using the typed `env` import from `_generated/server` instead of `process.env` for better type safety. You can use the [`@convex-dev/no-process-env`](/linting/overview.md#no-process-env) lint rule to automatically flag `process.env` reads, and suggest using `env.*` instead.

Note that you should not condition your Convex function exports on environment variables. The set of Convex functions that can be called is determined during deployment and is not reevaluated when you change an environment variable. The following code will throw an error at runtime, if the DEBUG environment variable changes between deployment and calling the function.

```
// THIS WILL NOT WORK!

export const myFunc = process.env.DEBUG ? mutation(...) : internalMutation(...);
```

Similarly, environment variables used in cron definitions will only be reevaluated on deployment.

## System environment variables[​](#system-environment-variables "Direct link to System environment variables")

The following environment variables are always available in Convex functions:

* `CONVEX_CLOUD_URL` - Your deployment URL (eg. `https://dusty-nightingale-847.convex.cloud`) for use with Convex clients.
* `CONVEX_SITE_URL` - Your deployment site URL (eg. `https://dusty-nightingale-847.convex.site`) for use with [HTTP Actions](/functions/http-actions.md)

## Project environment variable defaults[​](#project-environment-variable-defaults "Direct link to Project environment variable defaults")

You can set up default environment variable values for a project in Project Settings.

![Project default environment variables](/screenshots/storybook/components_project_default_environment_variables_light.webp)

These default values will be used when creating a new deployment, and will have no effect on existing deployments (they are not kept in sync). You can set a different default value for each [deployment type](/production/multiple-deployments.md#deployment-types).

The Deployment Settings will indicate when a deployment has environment variables that do not match the project defaults.

![Environment variable default mismatch](/screenshots/storybook/components_deployment_environment_variables_with_default_diff_light.webp)

You can also change the default environment variables from the CLI using `npx convex env default`.


---

<!-- Source: https://docs.convex.dev/cli/reference/env -->
Source: https://docs.convex.dev/cli/reference/env

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# `npx convex env`

Set and view environment variables on your deployment

* Set a variable: `npx convex env set NAME 'value'`
* Set interactively: `npx convex env set NAME`
* Set multiple from file: `npx convex env set --from-file .env`
* Unset a variable: `npx convex env remove NAME`
* List only variable names (no values): `npx convex env list --names-only`
* List all variables and their values: `npx convex env list --include-values`
* Print a variable's value: `npx convex env get NAME`

By default, this sets and views variables on your dev deployment.

See the environment variables guide (<https://docs.convex.dev/production/environment-variables>) to learn more.

## Syntax[​](#syntax "Direct link to Syntax")

```
npx convex env [options] [command]
```

## Options[​](#options "Direct link to Options")

* `--prod`

  Set and view environment variables on this project's default production deployment.

* `--deployment <deployment>`

  Set and view environment variables on a specific deployment. Accepts:

  * a deployment name (e.g. joyful-capybara-123)
  * a deployment reference (e.g. dev/james, staging)
  * `dev` (for your personal dev deployment)
  * `prod` (for your project’s default production deployment)
  * `local` (for your local dev deployment). You can also select deployments in other projects with `project-slug:reference` or `team-slug:project-slug:reference`.

## Subcommands[​](#subcommands "Direct link to Subcommands")

* [`npx convex env set`](#set) — Set a variable
* [`npx convex env get`](#get) — Print a variable's value
* [`npx convex env remove`](#remove) — Unset a variable
* [`npx convex env list`](#list) — List all environment variables and their values
* [`npx convex env default`](#default) — Manage project-level default environment variables

## `npx convex env set`[​](#set "Direct link to set")

Set environment variables on your deployment.

* `npx convex env set NAME 'value'`
* `npx convex env set NAME # omit a value to set one interactively`
* `npx convex env set NAME --from-file value.txt`
* `npx convex env set --from-file .env.defaults`

When setting multiple values, it will refuse all changes if any variables are already set to different values by default. Pass --force to overwrite the provided values.

To keep secrets out of your shell history, omit the value to pipe it in via stdin, for instance:

* `pbpaste | npx convex env set API_KEY` (macOS)
* `Get-Clipboard | npx convex env set API_KEY` (Windows PowerShell)

To update many variables at once, save them with `npx convex env list --include-values > .env.convex`, edit the file, then reapply the changes with `npx convex env set --force < .env.convex`.

### Syntax[​](#syntax-1 "Direct link to Syntax")

```
npx convex env set [options] [name] [value]
```

### Arguments[​](#arguments "Direct link to Arguments")

* `[name]`

  The name of the environment variable to set.

* `[value]`

  The value to set the variable to. Omit to set it interactively.

### Options[​](#options-1 "Direct link to Options")

* `--from-file <file>`

  Read environment variables from a .env file. Without --force, fails if any existing variable has a different value.

* `--force`

  When setting multiple variables, overwrite existing environment variable values instead of failing on mismatch.

## `npx convex env get`[​](#get "Direct link to get")

Print a variable's value: `npx convex env get NAME`

### Syntax[​](#syntax-2 "Direct link to Syntax")

```
npx convex env get [options] <name>
```

### Arguments[​](#arguments-1 "Direct link to Arguments")

* `<name>`

  The name of the environment variable to print.

## `npx convex env remove`[​](#remove "Direct link to remove")

Unset a variable: `npx convex env remove NAME` If the variable doesn't exist, the command doesn't do anything and succeeds.

### Syntax[​](#syntax-3 "Direct link to Syntax")

```
npx convex env remove [options] <name>
```

### Aliases[​](#aliases "Direct link to Aliases")

* `rm`
* `unset`

### Arguments[​](#arguments-2 "Direct link to Arguments")

* `<name>`

  The name of the environment variable to unset.

## `npx convex env list`[​](#list "Direct link to list")

* List only variable names (no values): `npx convex env list --names-only`
* List all variables and their values: `npx convex env list --include-values`
* Save all variables to a file: `npx convex env list --include-values > .env.convex`
* Append to a file: `npx convex env list --include-values >> .env.convex`

When an AI agent runs this command (detected from environment variables like AI\_AGENT or CLAUDECODE), only names are listed unless --include-values is passed.

### Syntax[​](#syntax-4 "Direct link to Syntax")

```
npx convex env list [options]
```

### Options[​](#options-2 "Direct link to Options")

* `--names-only`

  List only the names of environment variables, without their values

* `--include-values`

  Print each variable's value alongside its name, in .env format. This is the default unless an AI agent is detected, so pass it explicitly in scripts that rely on the values.

## `npx convex env default`[​](#default "Direct link to default")

Manage default environment variables for your project.

The default environment variables read and written to by this command are the ones for the deployment type of the current deployment (i.e. dev in most cases), unless --type is provided.

* Set a default variable: `npx convex env default set NAME 'value'`
* Unset a default variable: `npx convex env default remove NAME`
* List only default variable names (no values): `npx convex env default list --names-only`
* List all default variables and their values: `npx convex env default list --include-values`
* Print a default variable's value: `npx convex env default get NAME`

### Syntax[​](#syntax-5 "Direct link to Syntax")

```
npx convex env default [options] [command]
```

### `npx convex env default set`[​](#default-set "Direct link to default-set")

Set default environment variables for your project's deployment type.

* `npx convex env default set NAME 'value'`
* `npx convex env default set NAME # omit a value to set one interactively`
* `npx convex env default set NAME --from-file value.txt`
* `npx convex env default set --from-file .env.defaults`

When setting multiple values, it will refuse all changes if any variables are already set to different values by default. Pass --force to overwrite the provided values.

The deployment type is determined by the current deployment (local maps to dev), or by --type if provided.

#### Syntax[​](#syntax-6 "Direct link to Syntax")

```
npx convex env default set [options] [name] [value]
```

#### Arguments[​](#arguments-3 "Direct link to Arguments")

* `[name]`

  The name of the default environment variable to set.

* `[value]`

  The value to set the variable to. Omit to set it interactively.

#### Options[​](#options-3 "Direct link to Options")

* `--from-file <file>`

  Read environment variables from a .env file. Without --force, fails if any existing variable has a different value.

* `--force`

  When setting multiple variables, overwrite existing environment variable values instead of failing on mismatch.

* `--type <type>`

  Manage default env vars for the given deployment type (dev, preview, prod) instead of inferring from the current deployment.

* `--project <project>`

  Select a project manually. Accepts `team-slug:project-slug` or just `project-slug` (team inferred from your current project). Requires --type.

### `npx convex env default get`[​](#default-get "Direct link to default-get")

Print a default variable's value: `npx convex env default get NAME` The deployment type is determined by the current deployment (local maps to dev), or by --type if provided.

#### Syntax[​](#syntax-7 "Direct link to Syntax")

```
npx convex env default get [options] <name>
```

#### Arguments[​](#arguments-4 "Direct link to Arguments")

* `<name>`

  The name of the default environment variable to print.

#### Options[​](#options-4 "Direct link to Options")

* `--type <type>`

  Manage default env vars for the given deployment type (dev, preview, prod) instead of inferring from the current deployment.

* `--project <project>`

  Select a project manually. Accepts `team-slug:project-slug` or just `project-slug` (team inferred from your current project). Requires --type.

### `npx convex env default remove`[​](#default-remove "Direct link to default-remove")

Unset a default variable.

* `npx convex env default remove NAME`

If the variable doesn't exist, the command doesn't do anything and succeeds.

The deployment type is determined by the current deployment (local maps to dev), or by --type if provided.

#### Syntax[​](#syntax-8 "Direct link to Syntax")

```
npx convex env default remove [options] <name>
```

#### Aliases[​](#aliases-1 "Direct link to Aliases")

* `rm`
* `unset`

#### Arguments[​](#arguments-5 "Direct link to Arguments")

* `<name>`

  The name of the default environment variable to unset.

#### Options[​](#options-5 "Direct link to Options")

* `--type <type>`

  Manage default env vars for the given deployment type (dev, preview, prod) instead of inferring from the current deployment.

* `--project <project>`

  Select a project manually. Accepts `team-slug:project-slug` or just `project-slug` (team inferred from your current project). Requires --type.

### `npx convex env default list`[​](#default-list "Direct link to default-list")

* List only default variable names (no values): `npx convex env default list --names-only`
* List all default variables and their values: `npx convex env default list --include-values`

When an AI agent runs this command (detected from environment variables like AI\_AGENT or CLAUDECODE), only names are listed unless --include-values is passed.

The deployment type is determined by the current deployment (local maps to dev), or by --type if provided.

#### Syntax[​](#syntax-9 "Direct link to Syntax")

```
npx convex env default list [options]
```

#### Options[​](#options-6 "Direct link to Options")

* `--names-only`

  List only the names of environment variables, without their values

* `--include-values`

  Print each variable's value alongside its name, in .env format. This is the default unless an AI agent is detected, so pass it explicitly in scripts that rely on the values.

* `--type <type>`

  Manage default env vars for the given deployment type (dev, preview, prod) instead of inferring from the current deployment.

* `--project <project>`

  Select a project manually. Accepts `team-slug:project-slug` or just `project-slug` (team inferred from your current project). Requires --type.


---

<!-- Source: https://docs.convex.dev/cli/reference/dev -->
Source: https://docs.convex.dev/cli/reference/dev

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# `npx convex dev`

Develop against a dev deployment, watching for changes

1. Configures a new or existing project (if needed)
2. Updates generated types and pushes code to the configured dev deployment
3. Runs the provided command (if `--start` or `--run` is used)
4. Watches for file changes, and repeats step 2

## Syntax[​](#syntax "Direct link to Syntax")

```
npx convex dev [options]
```

## Options[​](#options "Direct link to Options")

* `-v, --verbose`

  Show full listing of changes

* `--typecheck <mode>`

  Check TypeScript files with `tsc --noEmit`.

* `--typecheck-components`

  Check TypeScript files within component implementations with `tsc --noEmit`.

* `--codegen <mode>`

  Regenerate code in `convex/_generated/`

* `--once`

  Execute only the first 3 steps, stop on any failure

* `--until-success`

  Execute only the first 3 steps, on failure watch for local and remote changes and retry steps 2 and 3

* `--start <command>`

  Start a long-running command alongside `npx convex dev`, like a frontend dev server. The command inherits stdin/stdout so you can interact with it directly. Example: npx convex dev --start 'vite --open'

* `--run <functionName>`

  The identifier of the function to run in step 3, like `api.init.createData` or `myDir/myFile:myFunction`

* `--run-component <functionName>`

  If --run is used and the function is in a component, the path to the component (e.g. "workflow" or "workflow/workpool"). Components are a beta feature. This flag is unstable and may change in subsequent releases.

* `--tail-logs [mode]`

  Choose whether to tail Convex function logs in this terminal:

  * `always` shows logs continuously
  * `pause-on-deploy` (the default) pauses logs during deploys so you can spot sync issues
  * `disable` hides logs while developing.

* `--configure [choice]`

  Ignore existing configuration and configure new or existing project, interactively or set by --team \<team\_slug>, --project \<project\_slug>, and --dev-deployment local|cloud

* `--env-file <envFile>`

  Path to a custom file of environment variables, for choosing the deployment, e.g. CONVEX\_DEPLOYMENT or CONVEX\_SELF\_HOSTED\_URL. Same format as .env.local or .env files, and overrides them.


---

<!-- Source: https://docs.convex.dev/cli/reference/run -->
Source: https://docs.convex.dev/cli/reference/run

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# `npx convex run`

Run a function or evaluate an inline readonly query on your deployment.

* Run a function with JSON arguments: `npx convex run messages:send '{"body": "hello", "author": "me"}'`
* Run a function on prod: `npx convex run messages:list --prod`
* Live-update a query's result: `npx convex run messages:list --watch`
* Push local code before running: `npx convex run messages:send '{}' --push`
* Evaluate an inline readonly query: `npx convex run --inline-query 'await ctx.db.query("messages").take(5)'`

Arguments are specified as a JSON object. By default, this runs on your dev deployment.

## Syntax[​](#syntax "Direct link to Syntax")

```
npx convex run [options] [functionName] [args]
```

## Arguments[​](#arguments "Direct link to Arguments")

* `[functionName]`

  identifier of the function to run, like `listMessages` or `dir/file:myFunction`

* `[args]`

  JSON-formatted arguments object to pass to the function.

## Options[​](#options "Direct link to Options")

* `-w, --watch`

  Watch a query, printing its result if the underlying data changes. Given function must be a query.

* `--inline-query <query>`

  JavaScript to evaluate as a readonly query. The query is completely sandboxed, so it can only read data and cannot modify the database or access the network.

  This is a one-shot query and cannot be combined with `--watch`. Use `--component` to target a mounted component.

  To format the query:

  * Simple expressions are returned automatically, for example: `await ctx.db.query("messages").take(5)`.
  * For multi-statement queries, use an explicit return, for example: `const firstMessage = await ctx.db.query("messages").first(); console.log(firstMessage?._id); return firstMessage;`.
  * For full control, pass a module source that exports a default query, for example: `export default query({ handler: async (ctx) => { return await ctx.db.query("messages").take(10); } })`.

* `--push`

  Push code to deployment before running the function.

* `--identity <identity>`

  JSON-formatted UserIdentity object, e.g. '{ name: "John", address: "0x123" }'

* `--typecheck <mode>`

  Whether to check TypeScript files with `tsc --noEmit`.

* `--typecheck-components`

  Check TypeScript files within component implementations with `tsc --noEmit`.

* `--codegen <mode>`

  Regenerate code in `convex/_generated/`

* `--component <path>`

  Path to the component (e.g. "workflow" or "workflow/workpool")

* `--prod`

  Run the function on this project's default production deployment.

* `--deployment <deployment>`

  Run the function on a specific deployment. Accepts:

  * a deployment name (e.g. joyful-capybara-123)
  * a deployment reference (e.g. dev/james, staging)
  * `dev` (for your personal dev deployment)
  * `prod` (for your project’s default production deployment)
  * `local` (for your local dev deployment). You can also select deployments in other projects with `project-slug:reference` or `team-slug:project-slug:reference`.


---

<!-- Source: https://docs.convex.dev/cli/reference/ai-files -->
Source: https://docs.convex.dev/cli/reference/ai-files

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

# `npx convex ai-files`

Convex AI files help AI coding assistants (Cursor, Claude Code, etc.) understand Convex patterns and APIs. They are set up during your first `npx convex dev` and can be managed at any time with the commands below.

## Syntax[​](#syntax "Direct link to Syntax")

```
npx convex ai-files [options] [command]
```

## Subcommands[​](#subcommands "Direct link to Subcommands")

* [`npx convex ai-files status`](#status) — Show the current status of Convex AI files
* [`npx convex ai-files install`](#install) — Install or refresh Convex AI files
* [`npx convex ai-files enable`](#enable) — Enable Convex AI files
* [`npx convex ai-files update`](#update) — Update Convex AI files to the latest version
* [`npx convex ai-files disable`](#disable) — Disable Convex AI files without removing them
* [`npx convex ai-files remove`](#remove) — Remove all Convex AI files from the project

## `npx convex ai-files status`[​](#status "Direct link to status")

Prints whether Convex AI files are enabled, and for each component:

* convex/\_generated/ai/guidelines.md
* AGENTS.md (Convex section)
* CLAUDE.md (if installed by Convex)
* Agent skills

Fetches the latest hashes from version.convex.dev to report whether each file is up to date. If the network is unavailable the staleness check is skipped silently.

### Syntax[​](#syntax-1 "Direct link to Syntax")

```
npx convex ai-files status [options]
```

## `npx convex ai-files install`[​](#install "Direct link to install")

Installs the following (or refreshes them if already present):

* convex/\_generated/ai/guidelines.md
* AGENTS.md (Convex section only)
* CLAUDE.md (Convex section only)
* Agent skills (installed to each coding agent's native path, configured via convex.json)

### Syntax[​](#syntax-2 "Direct link to Syntax")

```
npx convex ai-files install [options]
```

## `npx convex ai-files enable`[​](#enable "Direct link to enable")

Re-enables Convex AI files by writing `aiFiles.enabled: true` to `convex.json`, then installs or refreshes the managed AI files.

### Syntax[​](#syntax-3 "Direct link to Syntax")

```
npx convex ai-files enable [options]
```

## `npx convex ai-files update`[​](#update "Direct link to update")

Updates the following to their latest versions:

* convex/\_generated/ai/guidelines.md
* AGENTS.md (Convex section only)
* CLAUDE.md (Convex section only)
* Agent skills (installed to each coding agent's native path, configured via convex.json)

### Syntax[​](#syntax-4 "Direct link to Syntax")

```
npx convex ai-files update [options]
```

## `npx convex ai-files disable`[​](#disable "Direct link to disable")

Writes `aiFiles.enabled: false` to `convex.json` so `npx convex dev` stops prompting to install AI files and suppresses staleness messages.

Files already installed are left untouched - use `npx convex ai-files remove` if you also want to delete them.

Run `npx convex ai-files enable` to re-enable at any time.

### Syntax[​](#syntax-5 "Direct link to Syntax")

```
npx convex ai-files disable [options]
```

## `npx convex ai-files remove`[​](#remove "Direct link to remove")

Removes the following:

* convex/\_generated/ai/ directory (guidelines.md, ai-files.state.json)
* Convex sections from AGENTS.md and CLAUDE.md
* Agent skills installed by `npx convex ai-files install`

If removing the managed section leaves AGENTS.md or CLAUDE.md empty, the empty file is deleted. Otherwise the rest of the file is kept.

Skills installed from other sources are not affected.

Note: after `remove`, `npx convex dev` will suggest reinstalling AI files. Use `npx convex ai-files disable` to opt out entirely without deleting files.

### Syntax[​](#syntax-6 "Direct link to Syntax")

```
npx convex ai-files remove [options]
```


---

<!-- Source: https://docs.convex.dev/ai/using-claude-code -->
Source: https://docs.convex.dev/ai/using-claude-code

# Using Claude Code with Convex

> For AI agents: see [llms.txt](/llms.txt) for the complete documentation index. Markdown versions are available by adding .md to a page URL or requesting Accept: text/markdown.

[Claude Code](https://claude.com/claude-code), Anthropic's agentic coding tool, makes it easy to write and maintain apps built with Convex. Let's walk through how to set up Claude Code for the best possible results with Convex.

## Claude Code and Convex[​](#claude-code-and-convex "Direct link to Claude Code and Convex")

Claude Code works great with Convex out of the box. Because Convex is a TypeScript backend with end-to-end type safety, Claude Code's mistakes surface as compile errors, ACID transactions keep concurrent writes consistent, and apps scale without extra infrastructure. That's all you need to build anything from a real-time chat app to an AI agent backend. Adding the plugin lets you leverage the full power of Convex: Claude Code reads your live deployment through the MCP server, catches its own errors with the built-in hooks, and applies the idiomatic Convex patterns its skills and subagents know.

## Install the Convex plugin in Claude Code[​](#install-the-convex-plugin-in-claude-code "Direct link to Install the Convex plugin in Claude Code")

The official Convex plugin makes Claude Code work better with your Convex project. It includes:

* **Tools** that let your agent securely interact with your dev deployment (e.g. read the data/logs/insights or run functions).
* **Hooks and monitors** that keep your generated types in sync and surface errors as the agent works.
* **Skills and specialized agents** that teach your agent how to use Convex the most effectively.

See the [Agent Plugins overview](/ai/convex-plugins.md) for everything the plugin bundles.

To install the plugin, run the following command in Claude Code:

```
/plugin install convex@claude-plugins-official
```

## Starting a new project[​](#starting-a-new-project "Direct link to Starting a new project")

From an empty directory, launch Claude Code with what you want to build:

```
claude "build me a todo app with Convex" --permission-mode auto
```

Claude Code handles the rest. It runs `npm create convex@latest` and `npx convex dev --once`, which [auto-provisions a local backend](/cli/agent-mode.md#local-backend) without prompting for login because the agent's shell is non-interactive.

If you'd rather scaffold the project yourself first and then bring in Claude Code, the manual sequence is:

```
npm create convex@latest my-app

cd my-app

claude
```

## Adding to an existing project[​](#adding-to-an-existing-project "Direct link to Adding to an existing project")

If your project already has Convex set up, [install the Convex plugin](#install-the-convex-plugin-in-claude-code) to make Claude Code Convex-aware.

Now start asking Claude Code questions like:

* Evaluate my convex schema and suggest improvements
* What are this app's public endpoints?
* Run the `my_convex_function` query

## Running Claude Code with Convex in the cloud[​](#running-claude-code-with-convex-in-the-cloud "Direct link to Running Claude Code with Convex in the cloud")

When running Claude Code in a remote environment (e.g. Claude Code on a CI runner or a cloud VM), use Convex's [Agent Mode](/cli/agent-mode.md) so the agent can iterate on code, run tests, and call one-off functions without needing full deployment permissions.

A good setup script:

```
npm i

npx convex dev --once
```

In non-interactive shells (the typical case for an agent's setup script), `npx convex` won't prompt the agent to log in. It provisions a local deployment automatically. See [Agent Mode → Local backend](/cli/agent-mode.md#local-backend) for details.

This command requires "full" internet access to download the Convex binary.

For per-agent cloud dev deployments scoped to a single throwaway deploy key, see [Cloud dev deployments per agent](/ai/overview.md#cloud-dev-deployments-per-agent).
