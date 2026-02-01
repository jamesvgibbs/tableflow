/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attachments from "../attachments.js";
import type * as constraints from "../constraints.js";
import type * as email from "../email.js";
import type * as emailQueue from "../emailQueue.js";
import type * as events from "../events.js";
import type * as guests from "../guests.js";
import type * as http from "../http.js";
import type * as lib_tierLimits from "../lib/tierLimits.js";
import type * as matching from "../matching.js";
import type * as matchingConfig from "../matchingConfig.js";
import type * as preview from "../preview.js";
import type * as purchases from "../purchases.js";
import type * as rooms from "../rooms.js";
import type * as seatingHistory from "../seatingHistory.js";
import type * as sessions from "../sessions.js";
import type * as stripe from "../stripe.js";
import type * as tables from "../tables.js";
import type * as themes from "../themes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attachments: typeof attachments;
  constraints: typeof constraints;
  email: typeof email;
  emailQueue: typeof emailQueue;
  events: typeof events;
  guests: typeof guests;
  http: typeof http;
  "lib/tierLimits": typeof lib_tierLimits;
  matching: typeof matching;
  matchingConfig: typeof matchingConfig;
  preview: typeof preview;
  purchases: typeof purchases;
  rooms: typeof rooms;
  seatingHistory: typeof seatingHistory;
  sessions: typeof sessions;
  stripe: typeof stripe;
  tables: typeof tables;
  themes: typeof themes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
