/**
 * Deno-specific Given-When-Then spec builders, wired to `@std/assert`.
 *
 * This is the local adapter for the runtime-agnostic `createSpecs` factory
 * from `@fraktalio/fmodel-decider`. It pre-wires Deno's `@std/assert` so
 * that test files can import `DeciderEventSourcedSpec` and `ViewSpecification`
 * directly without any setup.
 */

import { assert, assertEquals } from "@std/assert";
import { createSpecs } from "@fraktalio/fmodel-decider";

const specs = createSpecs({ assertEquals, assert });

export const DeciderEventSourcedSpec = specs.DeciderEventSourcedSpec;
export const DeciderStateStoredSpec = specs.DeciderStateStoredSpec;
export const ViewSpecification = specs.ViewSpecification;
