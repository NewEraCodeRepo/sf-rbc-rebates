/* tslint:disable:max-classes-per-file */
import { spawnSync } from 'child_process';
import * as semver from 'semver';
import * as fs from "fs";

const PACKAGE_JSON_PATH = __dirname + '/../../package.json';
const manifest = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH).toString());

export class IncompatibleVersionError extends Error {
  constructor(check: VersionCheck) {
    super(
      `Incompatible ${check.descriptor} version detected: ` +
      `${check.actual} does not satisfy ${check.expected}`
    );
  }
}

class VersionCheck {
  constructor(
    public descriptor: string,
    public actual: any,
    public expected: string
  ) {}

  public get isValid() {
    return semver.satisfies(this.actual, this.expected);
  }

  public verifyCompatible() {
    if (!this.isValid) {
      throw new IncompatibleVersionError(this);
    }
  }
}

export function engineVersionChecks() {
  const nodeVersion = process.version;
  const yarnVersionCommand = spawnSync('yarn', ['--version']);
  const yarnVersion = yarnVersionCommand.stdout.toString();

  return [
    new VersionCheck('Node', nodeVersion, manifest.engines.node),
    new VersionCheck('Yarn', yarnVersion, manifest.engines.yarn)
  ];
}

export function verifyEngineCompatibility() {
  engineVersionChecks().forEach((check) => check.verifyCompatible());
}
