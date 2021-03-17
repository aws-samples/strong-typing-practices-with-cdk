#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { WellTypedStack } from "../lib/well-typed-stack";

const app = new cdk.App();
new WellTypedStack(app, "WellTypedStack");
