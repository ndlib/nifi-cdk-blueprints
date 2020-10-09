#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NiFiAppInfrastructureStack } from '../lib/app-infrastructure-stack';

const app = new cdk.App();

const owner = app.node.tryGetContext("owner");
const contact = app.node.tryGetContext("contact");
const networkStackName = app.node.tryGetContext("networkStackName");
const serviceName = app.node.tryGetContext("serviceName");
const domainStackName = app.node.tryGetContext("domainStack");

const service = new NiFiAppInfrastructureStack(app, 'NifiAppInfrastructure', { owner, contact, networkStackName, serviceName, domainStackName });
