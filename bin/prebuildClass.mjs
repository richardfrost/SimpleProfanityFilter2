/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, buildFilePathByEnv, loadJSONFile, parseArgv, writeJSONFile } from './lib.mjs';

export default class Prebuild {
  constructor(args) {
    this.loadedFromFile = false;
    this.data = this.defaultBuildData();
    this.environment = 'dev';
    this.loadBuildData(args);
  }

  activateBuildFile(sourceFile) {
    fse.copyFileSync(sourceFile, buildFilePath);
  }

  bookmarkletBuild() {
    this.data.target = 'bookmarklet';
    this.data.manifestVersion = 0;
  }

  chromeBuild() {
    switch (this.data.manifestVersion) {
      case 2: this.chromeMv2Build(); break;
      case 3: this.chromeMv3Build(); break;
    }
  }

  chromeMv2Build() {
    // Customizations for manifest version
  }

  chromeMv3Build() {
    // Customizations for manifest version
  }

  common() {
    this.data.version = process.env.npm_package_version;
  }

  defaultBuild() {
    this.chromeBuild();
  }

  defaultBuildData() {
    return {
      config: {},
      manifestVersion: 3,
      release: false,
      target: 'chrome',
      version: '1.0.0',
    };
  }

  edgeLegacyBuild() {
    // Target customizations
  }

  firefoxBuild() {
    // Target customizations
  }

  loadBuildData(args) {
    const argv = parseArgv(args);
    if (argv.count >= 2 && argv.count <= 4) {
      if (argv.arguments.includes('--release')) {
        argv.arguments.splice(argv.arguments.indexOf('--release'), 1);
        this.environment = 'release';
        this.data.release = true;
      }

      if (argv.arguments.includes('--test')) {
        argv.arguments.splice(argv.arguments.indexOf('--test'), 1);
        this.environment = 'test';
      }

      const target = argv.arguments[0]?.replace('--', '');
      if (target) {
        const targetArray = target.split('-');
        this.data.target = targetArray[0];
        if (targetArray.length == 2) {
          const manifestVersion = parseInt(targetArray[1].match(/\d$/)?.toString());
          if (manifestVersion) this.data.manifestVersion = manifestVersion;
        }
      } else {
        this.loadedFromFile = true;
        const envBuildFilePath = buildFilePathByEnv(this.environment);

        try {
          // Use existing buildFile as starting point if no target was passed
          this.data = loadJSONFile(envBuildFilePath);
        } catch (err) {
          console.warn(`${envBuildFilePath} doesn't exist, creating...`);
          writeJSONFile(envBuildFilePath, this.data);
        }
      }
    } else {
      throw (new Error('Incorrect number of arguments.'));
    }
  }

  run() {
    this.common();
    this.targetCustomizations();
    this.writeBuildData();
  }

  get showBuildDetails() {
    // Only show build details if no target was passed or if this is a release
    return this.loadedFromFile || this.data.release;
  }

  targetCustomizations() {
    switch (this.data.target) {
      case 'bookmarklet':
        this.bookmarkletBuild();
        break;
      case 'chrome':
        this.chromeBuild();
        break;
      case 'edgeLegacy':
        this.edgeLegacyBuild();
        break;
      case 'firefox':
        this.firefoxBuild();
        break;
      default:
        // throw new Error(`Invalid target: ${this.data.target}`);
        console.warn('\n!!!!! NOTICE: using default build !!!!!\n');
        this.defaultBuild();
    }
  }

  writeBuildData() {
    const filePath = buildFilePathByEnv(this.environment);
    writeJSONFile(filePath, this.data);
    this.activateBuildFile(filePath);
    if (this.showBuildDetails) {
      console.log(`Build details:\n${JSON.stringify(this.data, null, 2)}`);
    }
  }
}
